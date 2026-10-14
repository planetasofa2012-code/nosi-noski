// XML-фид для Автозагрузки Авито: /avito.xml
// Ссылку на этот адрес указывают в кабинете Авито → Автозагрузка → «Ссылка на файл».
import { avitoCategories, avitoConfig } from '@/avito.config';
import { avitoAd } from '@/lib/avito-text.mjs';
import { products, totalStock } from '@/lib/catalog';
import { site } from '@/lib/site';
import { getStock } from '@/lib/stock';


const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const stock = await getStock();
  const ads = products
    .filter((p) => !p.images.every((i) => i.endsWith('.svg'))) // без реальных фото на Авито не выгружаем
    .map((p) => {
      const ad = avitoAd(p, stock, { shopName: site.name });
      const cat = avitoCategories[p.category];
      const images = p.images.filter((i) => !i.endsWith('.svg')).slice(0, 10);
      const qty = totalStock(p, stock);
      return `  <Ad>
    <Id>${x(p.slug)}</Id>
    <AdStatus>Free</AdStatus>
    ${qty > 0 ? '' : '<DateEnd>' + new Date().toISOString().slice(0, 10) + '</DateEnd>'}
    <Category>${x(cat.Category)}</Category>
    <GoodsType>${x(cat.GoodsType)}</GoodsType>
    <Apparel>${x(cat.Apparel)}</Apparel>
    <AdType>${x(avitoConfig.adType)}</AdType>
    <Condition>${x(avitoConfig.condition)}</Condition>
    <Address>${x(avitoConfig.address)}</Address>
    ${avitoConfig.contactPhone ? `<ContactPhone>${x(avitoConfig.contactPhone)}</ContactPhone>` : ''}
    ${avitoConfig.managerName ? `<ManagerName>${x(avitoConfig.managerName)}</ManagerName>` : ''}
    <Title>${x(ad.title)}</Title>
    <Description><![CDATA[${ad.description.replace(/\]\]>/g, '')}]]></Description>
    <Price>${p.price}</Price>
    ${ad.sizes.length ? `<Size>${x(ad.sizes[0])}</Size>` : ''}
    <Delivery>${x(avitoConfig.delivery)}</Delivery>
    <Images>
${images.map((i) => `      <Image url="${x(new URL(i, site.url).toString())}"/>`).join('\n')}
    </Images>
  </Ad>`.replace(/\n\s*\n/g, '\n');
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Ads formatVersion="3" target="Avito.ru">\n${ads.join('\n')}\n</Ads>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
