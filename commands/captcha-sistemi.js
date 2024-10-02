const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('captcha-sistemi')
    .setDescription('Captcha sistemini açar veya kapatır')
    .addStringOption(option =>
      option.setName('durum')
        .setDescription('Captcha sistemini açmak veya kapatmak')
        .setRequired(true)
        .addChoices(
          { name: 'Aç', value: 'ac' },
          { name: 'Kapat', value: 'kapat' }
        )),
  async execute(interaction, db) {
    const durum = interaction.options.getString('durum');
    const mevcutDurum = db.get(`captchaEnabled_${interaction.guild.id}`) || false;

    if (durum === 'ac') {
      if (mevcutDurum) {
        return interaction.reply({ content: '❗ Captcha sistemi zaten açık.', ephemeral: true });
      }
      db.set(`captchaEnabled_${interaction.guild.id}`, true);
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Captcha Sistemi Açıldı')
        .setDescription('Captcha sistemi başarıyla açıldı.');
      await interaction.reply({ embeds: [embed] });
    } else {
      if (!mevcutDurum) {
        return interaction.reply({ content: '❗ Captcha sistemi zaten kapalı.', ephemeral: true });
      }
      db.set(`captchaEnabled_${interaction.guild.id}`, false);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Captcha Sistemi Kapatıldı')
        .setDescription('Captcha sistemi başarıyla kapatıldı.');
      await interaction.reply({ embeds: [embed] });
    }
  },
};