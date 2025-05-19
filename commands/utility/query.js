const { MessageFlags, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { request } = require('undici');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('query')
		.setDescription('查詢 NFT 最低價格前十筆資料')
	.addStringOption(option =>
		option.setName('裝備名稱')
			.setDescription('裝備名稱 (請輸入英文名稱)'))
	.addStringOption(option =>
		option.setName('類型')
			.setDescription('請根據選項輸入裝備類型，不輸入為全選擇')
			.addChoices(
				{ name: '武器', value: 'weapon' },
				{ name: '防具', value: 'armor' },
				{ name: '時裝', value: 'decoration' },
				{ name: '工具', value: 'utility' },
				{ name: '其他', value: 'set-up' },
			))
	// .addStringOption(option =>
	// 	option.setName('子分類')
	// 		.setDescription('種類的子分類，請先選擇類型')
	// 		.setAutocomplete(true))
	.addNumberOption(option =>
		option.setName('最小價格')
			.setDescription('請輸入數字')
			.setMinValue(0)
			.setMaxValue(10000000000))
	.addNumberOption(option =>
		option.setName('最大價格')
			.setDescription('請輸入數字')
			.setMinValue(0)
			.setMaxValue(10000000000)),
	// async autocomplete(interaction) {
	// 	const cate = interaction.options.get('類型').value;
	// 	const subCategories = {
	// 		'weapon': [
	// 			{ name: '單手武器', value: 'one-handed weapon' },
	// 			{ name: '雙手武器', value: 'two-handed weapon' },
	// 			{ name: '副武', value: 'secondary weapon' },
	// 		],
	// 		'armor': [
	// 			{ name: '頭盔', value: 'hat' },
	// 			{ name: '上衣', value: 'top' },
	// 			{ name: '套裝', value: 'outfit' },
	// 			{ name: '褲子', value: 'bottom' },
	// 			{ name: '鞋子', value: 'shoes' },
	// 			{ name: '手套', value: 'gloves' },
	// 			{ name: '披風', value: 'cape' },
	// 		],
	// 		'decoration': [
	// 			{ name: '頭飾', value: 'head decoration' },
	// 		],
	// 	};
	// 	await interaction.respond(subCategories[cate] || []);
	// },
	async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const {
      statusCode,
      body
    } = await request('https://msu.io/marketplace/api/marketplace/explore/items', {
      method: 'POST',
      headers: {
        'Host': 'msu.io',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome'
      },
      body: JSON.stringify({
        "paginationParam": {
            "pageNo": 1,
            "pageSize": 10
        },
        "sorting":"ExploreSorting_LOWEST_PRICE",
      })
    })

    if (statusCode !== 200) {
      console.error('Error:', statusCode);
      await interaction.editReply("查詢失敗，請稍後再試或聯絡管理員");
      return;
    }

    const response = await body.json();
    const resultData = parseMsnItemsResponse(response);

    const embes = []
    for (const item of resultData) {
      embes.push(new EmbedBuilder()
        .setTitle(item.equipName)
        .addFields(
          { name: '價格', value: item.price }
        )
        .setImage(item.imageUrl)
        .setURL(`https://msu.io/marketplace/nft/${item.tokenId}`));
    }

		await interaction.editReply({ embeds: embes, ephemeral: true });
	},
};

function parseMsnItemsResponse(response) {
  const resultData = response.items.map(item=> ({
    equipName: item.name,
    price: weiToEther(item.salesInfo.priceWei),
    imageUrl: item.imageUrl,
    tokenId: item.tokenId,
  }))
  return resultData;
}

function weiToEther(wei) {
  const ether = wei / 1e18;
  return ether.toString().trimEnd("0");
}
