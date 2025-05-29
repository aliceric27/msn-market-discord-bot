const { MessageFlags, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { browserManager } = require('../../scripts/brower-manager.js');

function parseMsnItemsResponse(data) {
  const resultData = data.map(item=> ({
    equipName: item.name,
    price: weiToEther(item.salesInfo.priceWei),
    imageUrl: item.imageUrl,
    tokenId: item.tokenId,
  }))
  return resultData;
}

function weiToEther(wei) {
  const ether = wei / 1e18;
  return ether.toFixed(4).toString().trimEnd("0");
}

async function fetchMarketplaceData(interaction, params) {
  try {
    await interaction.editReply({ content: "爬蟲開始，虛擬瀏覽器建立中...", ephemeral: true });
    const page = await browserManager.getPage('https://msu.io');


    await interaction.editReply({ content: "發送 API ...", ephemeral: true });
    const apiRequestHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
    const apiResult = await browserManager.pageCallApi(
      page,
      'https://msu.io/marketplace/api/marketplace/explore/items',
      'POST',
      apiRequestHeaders,
      params);

    console.log('API 請求結果:', apiResult.success ? '成功' : '失敗');
    const resultData = parseMsnItemsResponse(apiResult.data.items);
    return resultData;
  }
  catch (error) {
    console.error('示例運行錯誤:', error);
  }
}


module.exports = {
	cooldown: 0.5,
	data: new SlashCommandBuilder()
		.setName('querynfts')
		.setDescription('查詢 NFT 最低價格前十筆資料')
	.addStringOption(option =>
		option.setName('裝備名稱')
			.setDescription('裝備名稱 (請輸入英文名稱)'))
	.addStringOption(option =>
		option.setName('類型')
			.setDescription('請根據選項輸入裝備類型，不輸入為全選擇')
			.addChoices(
				{ name: '武器', value: '10' },
				{ name: '防具', value: '20' },
				{ name: '時裝', value: '30' },
				{ name: '工具', value: '40' },
				{ name: '其他', value: '50' },
			))
	.addStringOption(option =>
		option.setName('子分類-1')
			.setDescription('類型的子分類，請先選擇類型')
			.setAutocomplete(true))
  .addStringOption(option =>
		option.setName('子分類-2')
			.setDescription('子分類-1的子分類，請先選擇子分類-1')
			.setAutocomplete(true))
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
	async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name === '子分類-1') {
      const cate = interaction.options.get('類型').value
      const choicesMapping = {
        '10': [
          { name: '單手武器', value: '10' },
          { name: '雙手武器', value: '20' },
          { name: '副武', value: '30' },
        ],
        '20': [
          { name: "防具", value: "10" },
          { name: "飾品", value: "20" }
        ],
        '30': [
          { name: "服裝", value: "10" },
          { name: "美容", value: "20" },
        ],
        '40': [
          { name: "寵物", value: "10" }
        ],
        '50': [
          { name: "椅子", value: "10" },
          { name: "坐騎", value: "20" },
          { name: "傷害皮膚", value: "30" },
          { name: "箭矢、飛鏢和子彈", value: "40" }
        ]
      };
      const choices = choicesMapping[cate] || [];
      await interaction.respond(choices);
      return;
    }
      const cate = interaction.options.get('類型').value;
      const subCate = interaction.options.get('子分類-1')?.value
      const choicesMapping = {
        '10': {
          '10': [
            { name: '單手劍', value: '01' },
            { name: '單手斧', value: '02' },
            { name: '單手鈍器', value: '03' },
            { name: '匕首', value: '04' },
            { name: '魔杖', value: '05' },
            { name: '法杖', value: '06' },
          ],
          '20': [
            { name: '雙手劍', value: '01' },
            { name: '雙手斧', value: '02' },
            { name: '雙手鈍器', value: '03' },
            { name: '矛', value: '04' },
            { name: '槍', value: '05' },
            { name: '弓', value: '06' },
            { name: '弩', value: '07' },
            { name: '拳套', value: '08' },
            { name: '指虎', value: '09' },
            { name: '槍', value: '10' },
          ],
          '30': [
            { name: "勳章", value: "01" },
            { name: "念珠", value: "02" },
            { name: "鐵鍊", value: "03" },
            { name: "魔法書", value: "04" },
            { name: "箭羽", value: "05" },
            { name: "弓臂塊", value: "06" },
            { name: "匕首鞘", value: "07" },
            { name: "護符", value: "08" },
            { name: "腕帶", value: "09" },
            { name: "遠望", value: "10" }
          ],
        },
        '20': {
          "10": [
            { name: "帽子", value: "01" },
            { name: "上衣", value: "02" },
            { name: "套裝", value: "03" },
            { name: "褲子", value: "04" },
            { name: "鞋子", value: "05" },
            { name: "手套", value: "06" },
            { name: "披風", value: "07" },
          ],
          "20": [
            { name: "臉部飾品", value: "01" },
            { name: "眼部飾品", value: "02" },
            { name: "耳環", value: "03" },
            { name: "戒指", value: "04" },
            { name: "墜飾", value: "05" },
            { name: "腰帶", value: "06" },
            { name: "肩部飾品", value: "07" },
            { name: "口袋物品", value: "08" },
            { name: "徽章", value: "09" },
            { name: "紋章", value: "10" }
          ]
        },
        "40": {
          "10": [
            { name: "帽子", value: "01" },
            { name: "上衣", value: "02" },
            { name: "套裝", value: "03" },
            { name: "褲子", value: "04" },
            { name: "鞋子", value: "05" },
            { name: "手套", value: "06" },
            { name: "披風", value: "07" },
            { name: "臉部飾品", value: "08" },
            { name: "眼部飾品", value: "09" },
            { name: "耳環", value: "10" },
            { name: "戒指", value: "11" },
            { name: "武器", value: "12" },
            { name: "寵物裝備", value: "13" },
          ],
          "20": [
            { name: "臉部", value: "01" },
            { name: "髮型", value: "02" },
            { name: "皮膚", value: "03" }
          ]
        },
        "50": {
          "40": [
            { name: "弓箭", value: "01" },
            { name: "弩箭", value: "02" },
            { name: "飛鏢", value: "03" },
            { name: "子彈", value: "04" }
          ]
        }
      }

      await interaction.respond(
        choicesMapping[cate]?.[subCate]?.map(choice => ({
          name: choice.name,
          value: choice.value
        })) || []
      );
      return
	},
	async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    // 取得各選項的值

    const equipName = interaction.options.getString('裝備名稱');
    const equipType = interaction.options.getString('類型');
    const subType1 = interaction.options.getString('子分類-1') || '00';
    const subType2 = interaction.options.getString('子分類-2') || '00';
    const minPrice = interaction.options.getNumber('最小價格') || 0;
    const maxPrice = interaction.options.getNumber('最大價格') || 10000000000;

    const filter = {
      categoryNo: 0,
      potential: {
        min: 0,
        max: 4
      },
      bonusPotential: {
        min: 0,
        max: 4
      },
      starforce: {
        min: 0,
        max: 25
      },
      level: {
        min: 0,
        max: 250
      },
      pirce: {
        min: minPrice,
        max: maxPrice
      }
    }

    if (equipName) {
      filter.name = equipName;
    }

    if (equipType) {
      const categoryNoString = `1000${equipType}${subType1}${subType2}`;
      filter.categoryNo = Number.parseInt(categoryNoString);
    }

    const resultData = await fetchMarketplaceData(
      interaction,
      {
        filter,
        "paginationParam": {
          "pageNo": 1,
          "pageSize": 5
        },
        "sorting":"ExploreSorting_LOWEST_PRICE",
      }
    )

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

