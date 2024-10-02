const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rol-ayarla')
    .setDescription('Başarılı doğrulamadan sonra verilecek rolü ayarlar')
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Doğrulamadan sonra verilecek rol')
        .setRequired(true)),
  async execute(interaction, db) {
    const role = interaction.options.getRole('rol');
    
    db.set(`verifiedRole_${interaction.guild.id}`, role.id);
    
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Doğrulama Rolü Ayarlandı')
      .setDescription(`Doğrulama rolü ${role} olarak ayarlandı`);

    await interaction.reply({ embeds: [embed] });
  },
};