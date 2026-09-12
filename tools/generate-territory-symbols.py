"""Sculpted flag-wrapped territory symbols, derived from local licensed flag vectors.
These are AgWorld artistic motifs, not claims of official country/province emblems.
The vector construction preserves small-map legibility and the exact source flag colours.
"""
from pathlib import Path
import json,re,html
root=Path(__file__).resolve().parents[1]/'AG WORLD/data/gis/africa'
out=root/'symbols';out.mkdir(exist_ok=True);(out/'provinces').mkdir(exist_ok=True)
shapes={
 'antelope':'M18 76Q31 61 48 57L69 57L80 43L82 30L74 13L81 17L89 33L94 13L98 11L95 36L106 45L102 53L91 51L82 72L79 96L72 96L71 76L50 78L41 96L34 96L39 73L28 72L20 83Z',
 'elephant':'M14 56Q15 36 41 34L67 34Q92 28 105 44L111 62L104 90Q101 98 92 96L90 91L98 84L98 63L90 66L85 56L84 94L71 94L69 70L45 70L42 94L29 94L28 66L18 68L16 81L11 80Z',
 'eagle':'M12 31L40 41L50 57L55 41L62 37L63 25L71 21L82 27L70 34L74 50L86 39L113 30L107 46L94 58L103 60L84 73L74 69L76 85L85 94L66 91L50 94L58 82L56 70L41 74L25 63L35 60L22 50Z',
 'diamond':'M18 41L35 18L88 18L109 41L64 103Z M18 41H109 M35 18L45 41L64 103L80 41L88 18 M45 41L62 18L80 41',
 'baobab':'M43 101L49 78L48 56L27 58L18 48L19 35L28 28L39 30L42 16L57 11L67 18L80 14L96 21L97 31L109 38L109 51L98 60L80 57L74 65L78 88L88 101L69 99L61 93L55 100Z',
 'hat':'M18 91L53 48L58 21L65 13L72 22L77 48L113 92Q65 111 18 91Z M25 81Q66 94 105 81 M48 57Q65 64 82 57',
 'shield':'M64 12Q92 25 98 43L89 79L64 106L40 80L30 44Q40 24 64 12Z M64 15V102 M25 14L101 104 M103 16L25 103',
 'dodo':'M43 94L52 79Q29 75 24 57Q20 33 38 28Q52 23 65 39L72 40L71 24Q70 11 84 13L97 19L111 33L109 45L96 43L90 37L84 62Q83 84 65 87L70 98L85 101L82 107L64 106L55 94L51 103L37 104L33 99Z',
 'tortoise':'M21 81L25 71L12 65L18 56L28 60Q29 34 62 31Q89 30 99 58L112 57L119 64L112 72L99 71L95 86L84 91L78 76L48 76L41 89L30 91Z M31 61L48 42L76 41L94 62L76 72L48 72Z M48 42L48 72 M76 41L76 72',
 'mountain':'M12 99L39 47L50 60L69 18L93 61L101 53L119 99Z M53 52L69 18L84 46L74 41L69 47L62 42Z',
 'dhow':'M14 79L107 79L94 98L34 100Z M67 14L67 75L19 75Z M74 23L111 72L74 72Z',
 'fish':'M12 62L28 48L40 49Q60 27 86 47L111 33L108 59L118 80L89 77Q63 99 39 76L24 74Z M47 47L55 34L74 36L83 46',
 'flower':'M63 51Q28 17 41 14Q57 12 64 39Q71 9 84 17Q91 30 71 49Q105 28 110 43Q110 57 80 58Q111 67 99 80Q84 89 70 67Q71 103 55 104Q43 98 57 67Q25 91 19 75Q22 60 50 58Q18 52 25 39Q38 29 63 51Z',
 'lion':'M64 12L82 17L91 29L104 35L106 57L96 74L92 89L76 96L64 108L47 96L34 92L30 76L19 62L21 40L31 29L45 19Z M40 39Q62 29 85 41L88 60L77 77L64 87L50 75L37 59Z',
 'giraffe':'M29 98L31 65L49 58L69 26L66 18L72 13L77 18L83 13L88 18L86 24L101 30L99 40L87 39L72 72L66 75L70 100L61 101L53 76L44 77L38 100Z',
 'cocoa':'M64 12Q96 17 100 58Q99 88 62 108Q27 89 27 60Q27 25 64 12Z M64 12Q43 60 62 108 M64 12Q84 59 62 108 M29 48L96 46 M32 76L94 77',
 'palm':'M59 102L64 48Q39 61 18 51Q32 34 58 40Q41 15 29 18Q52 5 70 33Q78 11 102 17L78 38Q106 30 117 48Q93 56 75 48L78 102Z',
 'drum':'M34 23Q63 12 96 25L86 85Q62 104 41 86Z M34 23Q66 38 96 25 M39 39L89 72 M91 40L44 73',
 'gorilla':'M38 20L50 13L74 14L89 25L93 47L105 58L109 88L96 97L83 95L82 70L74 80L78 102L62 102L58 83L49 101L33 100L39 75L30 95L16 90L21 59L35 47Z',
 'obelisk':'M48 100L48 24L64 9L80 24L80 100Z M35 101H94L100 109H29Z M64 10V97 M49 42H80 M49 64H80',
 'gazelle':'M38 102L43 72L37 56L49 39L50 18L44 10L55 14L59 34L69 31L73 12L85 8L81 17L79 34L94 45L90 55L75 54L67 71L73 101L62 101L56 78L48 104Z',
 'star':'M64 12L77 43L111 45L85 67L92 102L64 83L34 103L42 67L16 46L51 42Z',
 'coffee':'M40 20Q69 9 89 33Q107 58 85 91Q68 114 42 97Q15 78 29 43Z M70 18Q37 48 63 64Q78 80 52 101',
 'sunrise':'M13 96H116V108H13Z M24 85Q31 45 64 44Q101 48 107 85Z M64 12V32 M28 26L40 39 M100 27L88 39 M12 55L27 61 M113 55L101 61',
 'tablemountain':'M10 96L24 63L35 64L45 38L90 38L96 63L109 65L119 96Z M45 38L49 61L86 61L90 38',
 'skyline':'M17 104V58H39V96H44V35H63V96H69V18H84V96H89V48H111V104Z M23 68H34 M23 80H34 M50 47H57 M50 61H57 M75 31H79 M75 46H79 M95 61H104',
 'maize':'M56 99Q24 86 18 62Q43 62 55 83L50 31Q52 12 64 12Q78 14 80 31L74 82Q90 61 115 57Q106 86 75 100Z M52 32H78 M54 45H78 M55 58H77 M63 14V94',
 'sunflower':'M64 18L74 31L91 23L94 42L113 46L102 61L114 78L94 81L90 100L73 92L63 110L54 92L35 101L32 82L14 77L26 61L14 46L34 41L36 22L54 31Z M43 60A21 21 0 1 0 85 60A21 21 0 1 0 43 60',
}
country={
 'ao':('antelope','Giant sable antelope'),'bw':('diamond','Diamond'),'cd':('gorilla','Forest gorilla'),'km':('flower','Ylang-ylang flower'),'sz':('shield','Shield'),'ls':('hat','Mokorotlo hat'),'mg':('baobab','Baobab'),'mw':('fish','Lake fish'),'mu':('dodo','Dodo'),'mz':('dhow','Sailing dhow'),'na':('gazelle','Oryx'),'sc':('tortoise','Giant tortoise'),'za':('antelope','Springbok'),'tz':('mountain','Kilimanjaro'),'zm':('eagle','Fish eagle'),'zw':('eagle','Zimbabwe bird inspired sculpture'),
 'bj':('palm','Palm'),'bf':('star','Guiding star'),'bi':('drum','Royal drum'),'cm':('lion','Lion'),'cv':('dhow','Island sailing boat'),'cf':('elephant','Forest elephant'),'td':('gazelle','Desert antelope'),'gq':('baobab','Silk-cotton tree inspired sculpture'),'er':('dhow','Red Sea dhow'),'et':('obelisk','Aksum inspired obelisk'),'ga':('gorilla','Gorilla'),'gh':('star','Black Star inspired sculpture'),'gn':('drum','Drum'),'gw':('palm','Coastal palm'),'ci':('cocoa','Cocoa pod'),'ke':('lion','Lion'),'lr':('star','Lone Star inspired sculpture'),'ml':('obelisk','Sahel tower inspired sculpture'),'mr':('gazelle','Desert gazelle'),'ne':('giraffe','Giraffe'),'ng':('eagle','Eagle'),'cg':('gorilla','Gorilla'),'rw':('gorilla','Mountain gorilla'),'st':('cocoa','Cocoa pod'),'sn':('baobab','Baobab'),'sl':('lion','Lion'),'so':('star','Star'),'ss':('eagle','Fish eagle'),'sd':('obelisk','Nubian tower inspired sculpture'),'gm':('palm','River palm'),'tg':('palm','Palm'),'ug':('eagle','Crested bird inspired sculpture')}
province={'westerncape':('tablemountain',['#005984','#e7d3a2','#147a45'],'Table Mountain'),'northerncape':('diamond',['#a55735','#edc96b','#2a7580'],'Diamond'),'easterncape':('elephant',['#145b45','#e6b552','#276580'],'Elephant'),'kwazulunatal':('shield',['#9e2e30','#f3dcab','#182b43'],'Shield'),'gauteng':('skyline',['#24599a','#e7bd46','#c7dde0'],'City skyline'),'freestate':('maize',['#d5ac39','#f1e0a4','#1a7654'],'Maize'),'northwest':('sunflower',['#237f61','#eabf34','#475c83'],'Sunflower'),'mpumalanga':('sunrise',['#f5bc3d','#d36533','#23634c'],'Rising sun'),'limpopo':('baobab',['#8e4631','#dcb855','#3b814e'],'Baobab')}
def render(key,flag,title):
 path=shapes[key];silhouette=path.split(' M')[0]
 if key=='sunrise': silhouette='M13 108V96H24V85Q31 45 64 44Q101 48 107 85V96H116V108Z'
 return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144"><title>{html.escape(title)}</title><defs>
 <path id="body" d="{silhouette}"/><clipPath id="face"><use href="#body"/></clipPath>
 <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a4d4da"/><stop offset=".2" stop-color="#183742"/><stop offset=".6" stop-color="#061421"/><stop offset="1" stop-color="#81a8a9"/></linearGradient>
 <linearGradient id="glaze" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#fff" stop-opacity=".65"/><stop offset=".24" stop-color="#fff" stop-opacity=".06"/><stop offset=".49" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#001b2e" stop-opacity=".35"/><stop offset="1" stop-color="#001321" stop-opacity=".65"/></linearGradient>
 <radialGradient id="shadow"><stop stop-color="#001019" stop-opacity=".75"/><stop offset="1" stop-color="#001019" stop-opacity="0"/></radialGradient>
 </defs><ellipse cx="76" cy="127" rx="65" ry="13" fill="url(#shadow)"/>
 <g transform="translate(6 5) matrix(.95 -.12 .05 .99 0 8)">
 <use href="#body" transform="translate(7 9)" fill="url(#metal)" stroke="#04121c" stroke-width="4" stroke-linejoin="round"/>
 <use href="#body" transform="translate(4 5)" fill="url(#metal)" stroke="#4f7a80" stroke-width="3" stroke-linejoin="round"/>
 <use href="#body" fill="url(#metal)" stroke="#b5d9d5" stroke-width="3" stroke-linejoin="round"/>
 <g clip-path="url(#face)">{flag}<use href="#body" fill="url(#glaze)"/>
 <path d="M0 0H132V28Q71 22 0 74Z" fill="#fff" opacity=".12"/></g>
 <path d="{path}" fill="none" stroke="#eaffff" stroke-width="1.4" stroke-opacity=".45" stroke-linejoin="round"/>
 </g></svg>'''
manifest=[]
for entry in json.loads((root/'index.json').read_text(encoding='utf8'))['countries']:
 iso=entry['iso2'];key,label=country[iso];flag=(root/'flags'/f'{iso}.svg').read_text(encoding='utf8');flag=re.sub(r'<svg\b','<svg x="8" y="8" width="116" height="102" preserveAspectRatio="none"',flag,count=1)
 (out/f'{iso}.svg').write_text(render(key,flag,entry['name']+' · '+label),encoding='utf8');manifest.append({'country':entry['name'],'iso2':iso,'symbol':label,'asset':iso+'.svg'})
for name,(key,colors,label) in province.items():
 flag=''.join(f'<rect x="0" y="{i*42}" width="128" height="43" fill="{c}"/>' for i,c in enumerate(colors));(out/'provinces'/f'{name}.svg').write_text(render(key,flag,label+' · AgWorld provincial palette'),encoding='utf8')
(out/'manifest.json').write_text(json.dumps({'artDirection':'Sculpted flag-wrapped AgWorld symbols. Provincial palettes are artistic, not official flags or coats of arms.','countries':manifest,'provinces':{n:{'symbol':v[2],'palette':v[1]} for n,v in province.items()}},indent=2),encoding='utf8')
print('Generated',len(manifest),'country sculptures and',len(province),'province sculptures')
