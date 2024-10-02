const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setDescription('Mevcut komutların listesini gösterir'),
  async execute(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🤖 Bot Komutları')
      .setDescription('İşte mevcut komutlar:')
      .addFields(
        { name: '/captcha-kanal-ayarla', value: 'Captcha doğrulaması için kanalı ayarlar.' },
        { name: '/rol-ayarla', value: 'Başarılı doğrulamadan sonra verilecek rolü ayarlar.' },
        { name: '/log-kanal-ayarla', value: 'Captcha sonuçlarının loglanacağı kanalı ayarlar.' },
        { name: '/log-kanal-sifirla', value: 'Log kanalı ayarını sıfırlar.' },
        { name: '/captcha-sistemi', value: 'Captcha sistemini açar veya kapatır.' }
      )
      .setFooter({ text: 'Not: Tüm komutlar yalnızca yönetici yetkisine sahip kullanıcılar tarafından kullanılabilir.' });

    await interaction.reply({ embeds: [helpEmbed] });
  },
};
