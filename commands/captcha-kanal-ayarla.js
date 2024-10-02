const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('captcha-kanal-ayarla')
    .setDescription('Captcha doğrulaması için kanalı ayarlar')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Captcha doğrulaması için kullanılacak kanal')
        .setRequired(true)),
  async execute(interaction, db) {
    const channel = interaction.options.getChannel('kanal');
    
    db.set(`captchaChannel_${interaction.guild.id}`, channel.id);
    
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Captcha Kanalı Ayarlandı')
      .setDescription(`Captcha kanalı ${channel} olarak ayarlandı`);

    await interaction.reply({ embeds: [embed] });
  },
};