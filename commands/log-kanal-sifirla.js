const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-kanal-sifirla')
    .setDescription('Log kanalı ayarını sıfırlar'),
  async execute(interaction, db) {
    const logChannel = db.get(`logChannel_${interaction.guild.id}`);
    
    if (!logChannel) {
      return interaction.reply({ content: '❗ Log kanalı zaten ayarlanmamış.', ephemeral: true });
    }
    
    db.delete(`logChannel_${interaction.guild.id}`);
    
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Log Kanalı Sıfırlandı')
      .setDescription('Log kanalı ayarı başarıyla sıfırlandı.');

    await interaction.reply({ embeds: [embed] });
  },
};