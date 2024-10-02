const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-kanal-ayarla')
    .setDescription('Captcha sonuçlarının loglanacağı kanalı ayarlar')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Log kanalı olarak kullanılacak kanal')
        .setRequired(true)),
  async execute(interaction, db) {
    const channel = interaction.options.getChannel('kanal');
    
    db.set(`logChannel_${interaction.guild.id}`, channel.id);
    
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Log Kanalı Ayarlandı')
      .setDescription(`Log kanalı ${channel} olarak ayarlandı`);

    await interaction.reply({ embeds: [embed] });
  },
};