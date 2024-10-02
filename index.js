const { Client, GatewayIntentBits, Collection, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const { token } = require('./config.json');
const db = require('croxydb');
const { CaptchaGenerator } = require('captcha-canvas');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

client.once('ready', async () => {
  console.log('Bot hazır!');

  try {
    console.log('Slash komutları yükleniyor...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log('Slash komutları başarıyla yüklendi!');
  } catch (error) {
    console.error('Slash komutları yüklenirken bir hata oluştu:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!', ephemeral: true });
  }

  try {
    await command.execute(interaction, db);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ Bu komutu çalıştırırken bir hata oluştu!', ephemeral: true });
  }
});

client.on('guildMemberAdd', async member => {
  await createCaptcha(member);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const captchaEnabled = db.get(`captchaEnabled_${message.guild.id}`);
  if (!captchaEnabled) return;

  const captchaChannelId = db.get(`captchaChannel_${message.guild.id}`);
  if (message.channel.id !== captchaChannelId) return;

  const verifiedRoleId = db.get(`verifiedRole_${message.guild.id}`);
  if (!verifiedRoleId) return;

  const member = message.member;
  if (member.roles.cache.has(verifiedRoleId)) return;

  const activeCaptcha = db.get(`activeCaptcha_${member.id}`);
  if (activeCaptcha) {
    if (Date.now() - activeCaptcha.createdAt < 300000) { 
      if (message.content.toLowerCase() === activeCaptcha.text.toLowerCase()) {
        await verifyCaptcha(member, true);
      } else {
        await verifyCaptcha(member, false);
      }
    } else {
    
      db.delete(`activeCaptcha_${member.id}`);
      await createCaptcha(member);
    }
  } else {
    
    await createCaptcha(member);
  }
});

async function createCaptcha(member) {
  const captchaEnabled = db.get(`captchaEnabled_${member.guild.id}`);
  if (!captchaEnabled) return;

  const captchaChannelId = db.get(`captchaChannel_${member.guild.id}`);
  if (!captchaChannelId) return;

  const captchaChannel = member.guild.channels.cache.get(captchaChannelId);
  if (!captchaChannel) return;

  const captcha = new CaptchaGenerator()
    .setDimension(150, 450)
    .setCaptcha({ font: 'Sans', size: 60, characters: 6 })
    .setDecoy({ opacity: 0.5 })
    .setTrace({ color: '#32cf7e' });

  const buffer = await captcha.generate();
  const captchaText = captcha.text;

  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🔐 Captcha Doğrulama')
    .setDescription(`Hoş geldin ${member}! Lütfen sunucuya erişim kazanmak için aşağıdaki captcha'yı çöz.`)
    .setImage('attachment://captcha.png')
    .setFooter({ text: '⏳ Captcha\'yı çözmek için 5 dakikan var.' });

  const message = await captchaChannel.send({ embeds: [embed], files: [{ attachment: buffer, name: 'captcha.png' }] });

  db.set(`activeCaptcha_${member.id}`, { 
    text: captchaText, 
    createdAt: Date.now(), 
    messageId: message.id
  });

  setTimeout(async () => {
    const currentCaptcha = db.get(`activeCaptcha_${member.id}`);
    if (currentCaptcha && currentCaptcha.messageId === message.id) {
      await verifyCaptcha(member, false, true);
    }
  }, 300000); 
}

async function verifyCaptcha(member, success, timeout = false) {
  const captchaData = db.get(`activeCaptcha_${member.id}`);
  if (!captchaData) return;

  const captchaChannelId = db.get(`captchaChannel_${member.guild.id}`);
  const captchaChannel = member.guild.channels.cache.get(captchaChannelId);
  if (!captchaChannel) return;

  if (success) {
    db.delete(`activeCaptcha_${member.id}`);
    const roleId = db.get(`verifiedRole_${member.guild.id}`);
    if (roleId) {
      const role = member.guild.roles.cache.get(roleId);
      if (role) await member.roles.add(role);
    }
    const successEmbed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Captcha Başarılı')
      .setDescription(`${member}, captcha'yı başarıyla çözdün ve gerekli rol verildi.`);
    await captchaChannel.send({ embeds: [successEmbed] });
    logCaptchaResult(member, true);
  } else if (timeout) {
    db.delete(`activeCaptcha_${member.id}`);
    const timeoutEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('⏰ Captcha Zaman Aşımı')
      .setDescription(`${member}, captcha'yı zamanında çözemedin. Lütfen kanala bir mesaj yazarak yeni bir captcha iste.`);
    await captchaChannel.send({ embeds: [timeoutEmbed] });
    logCaptchaResult(member, false, true);
  } else {
    const retryEmbed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('⚠️ Yanlış Captcha')
      .setDescription(`${member}, yanlış captcha girdin. Lütfen tekrar dene.`);
    await captchaChannel.send({ embeds: [retryEmbed] });
    logCaptchaResult(member, false);
  }
}

function logCaptchaResult(member, success, timeout = false) {
  const logChannelId = db.get(`logChannel_${member.guild.id}`);
  if (!logChannelId) return;

  const logChannel = member.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(success ? 0x00FF00 : (timeout ? 0xFF0000 : 0xFFA500))
    .setTitle(success ? '✅ Captcha Başarılı' : (timeout ? '⏰ Captcha Zaman Aşımı' : '❌ Captcha Başarısız'))
    .setDescription(`**Kullanıcı:** ${member}`)
    .addFields(
      { name: 'Kullanıcı ID', value: member.id, inline: true },
      { name: 'Kullanıcı Adı', value: member.user.tag, inline: true },
      { name: 'Sonuç', value: success ? 'Doğrulandı' : (timeout ? 'Zaman Aşımı' : 'Yanlış Cevap'), inline: true },
      { name: 'Tarih', value: new Date().toLocaleString(), inline: false }
    )
    .setTimestamp()
    .setFooter({ text: `Sunucu: ${member.guild.name}`, iconURL: member.guild.iconURL() });

  logChannel.send({ embeds: [embed] });
}

client.login(token);