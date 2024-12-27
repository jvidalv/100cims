import json
from bs4 import BeautifulSoup

# Example data (shortened for brevity)
data =[
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-tossal-gros/'>El Tossal Gros</a>",
    "Alt Camp, Conca de BarberÃ ",
    "867",
    "1037"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-cogulla/'>La Cogulla</a>",
    "Alt Camp, Conca de BarberÃ ",
    "786",
    "892"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montagut-dancosa/'>Montagut d'Ancosa</a>",
    "Alt Camp",
    "963",
    "787"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puigcabrer/'>Puigcabrer</a>",
    "Alt Camp",
    "524",
    "691"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossa-grossa-de-montferri/'>Tossa Grossa de Montferri</a>",
    "Alt Camp",
    "387",
    "1012"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/bassegoda/'>Bassegoda</a>",
    "Alt EmpordÃ , Garrotxa",
    "1373",
    "984"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-gavarra/'>Puig de la Gavarra</a>",
    "Alt EmpordÃ ",
    "1057",
    "433"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castell-saverdera/'>Castell Saverdera</a>",
    "Alt EmpordÃ ",
    "682",
    "1062"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-mont/'>El Mont</a>",
    "Alt EmpordÃ ",
    "1125",
    "958"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-sallafort/'>Pic de Sallafort</a>",
    "Alt EmpordÃ , RossellÃ³",
    "994",
    "462"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-les-bruixes/'>Puig de les Bruixes</a>",
    "Alt EmpordÃ , Garrotxa",
    "1391",
    "879"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-desquers/'>Puig d'Esquers</a>",
    "Alt EmpordÃ ",
    "606",
    "556"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-neulos/'>Puig NeulÃ³s</a>",
    "Alt EmpordÃ , RossellÃ³",
    "1257",
    "851"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/querroig/'>Querroig</a>",
    "Alt EmpordÃ , RossellÃ³",
    "672",
    "553"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-del-comptador/'>Roc del Comptador</a>",
    "Alt EmpordÃ , Vallespir",
    "1451",
    "613"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-castellot/'>El Castellot</a>",
    "Alt PenedÃ¨s",
    "465",
    "977"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montau/'>Montau</a>",
    "Alt PenedÃ¨s, Baix Llobregat",
    "658",
    "893"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/penya-del-papiol/'>Penya del Papiol</a>",
    "Alt PenedÃ¨s",
    "381",
    "1104"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-dagulles/'>Puig d'Agulles</a>",
    "Alt PenedÃ¨s, Baix Llobregat",
    "653",
    "940"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-mola/'>Puig de la Mola</a>",
    "Alt PenedÃ¨s, Baix Llobregat, Garraf",
    "534",
    "968"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-laliga/'>Puig de l'Ã€liga</a>",
    "Alt PenedÃ¨s, Garraf",
    "464",
    "1052"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cap-del-verd/'>Cap del Verd</a>",
    "Alt Urgell, BerguedÃ , SolsonÃ¨s",
    "2284",
    "941"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cogullo-de-turp/'>CogullÃ³ de Turp</a>",
    "Alt Urgell",
    "1621",
    "604"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-cadinell/'>El Cadinell</a>",
    "Alt Urgell",
    "2113",
    "552"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-coscollet/'>El Coscollet</a>",
    "Alt Urgell",
    "1610",
    "544"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/les-piques/'>Les Piques</a>",
    "Alt Urgell",
    "1969",
    "286"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mirador-del-pla-de-llet/'>Mirador del Pla de Llet</a>",
    "Alt Urgell, Cerdanya",
    "2141",
    "677"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/monturull/'>Monturull</a>",
    "Alt Urgell, Andorra, Cerdanya",
    "2760",
    "707"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pedro-dels-quatre-batlles/'>PedrÃ³ dels Quatre Batlles</a>",
    "Alt Urgell, SolsonÃ¨s",
    "2387",
    "1155"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-saloria/'>Pic de SalÃ²ria</a>",
    "Alt Urgell, Pallars SobirÃ ",
    "2789",
    "470"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/bony-de-la-pica-o-pica-dos/'>Bony de la Pica o Pica d'Os</a>",
    "Alt Urgell, Andorra",
    "2405",
    "368"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-beneidor/'>Roc BeneÃ¯dor</a>",
    "Alt Urgell",
    "1681",
    "386"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-de-galliner/'>Roc de Galliner</a>",
    "Alt Urgell",
    "1630",
    "303"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-honorat/'>Sant Honorat</a>",
    "Alt Urgell",
    "1068",
    "703"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/santa-fe/'>Santa Fe</a>",
    "Alt Urgell",
    "1211",
    "639"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torreta-del-cadi/'>Torreta del CadÃ­</a>",
    "Alt Urgell",
    "2562",
    "504"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/vulturo/'>VulturÃ³</a>",
    "Alt Urgell",
    "2649",
    "589"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/besiberri-nord/'>Besiberri Nord</a>",
    "Alta RibagorÃ§a, Val d'Aran",
    "3008",
    "237"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/gran-pic-del-pesso/'>Gran Pic del PessÃ³</a>",
    "Alta RibagorÃ§a, Pallars JussÃ ",
    "2894",
    "163"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/gran-tuc-de-colomers/'>Gran Tuc de Colomers</a>",
    "Alta RibagorÃ§a, Val d'Aran",
    "2933",
    "216"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-faiada/'>La Faiada</a>",
    "Alta RibagorÃ§a, Pallars JussÃ ",
    "1699",
    "353"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lo-corrunco/'>Lo Corronco</a>",
    "Alta RibagorÃ§a",
    "2543",
    "399"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pala-del-teller/'>Pala del Teller</a>",
    "Alta RibagorÃ§a, Pallars JussÃ ",
    "1889",
    "453"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-comaloforno/'>Pic de Comaloforno</a>",
    "Alta RibagorÃ§a",
    "3029",
    "290"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-la-pala-alta-de-sarrade/'>Pic de la Pala Alta de SarradÃ©</a>",
    "Alta RibagorÃ§a",
    "2983",
    "74"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/punta-alta/'>Punta Alta</a>",
    "Alta RibagorÃ§a",
    "3014",
    "503"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/punta-dharle/'>Punta d'HarlÃ©</a>",
    "Alta RibagorÃ§a, Val d'Aran",
    "2885",
    "47"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-les-roies-de-cardet/'>Tossal de les Roies de Cardet</a>",
    "Alta RibagorÃ§a",
    "2445",
    "261"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-la-comamarja/'>Tuc de la Comamarja</a>",
    "Alta RibagorÃ§a",
    "2562",
    "230"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-lluca/'>Tuc de LluÃ§Ã </a>",
    "Alta RibagorÃ§a, Val d'Aran",
    "2778",
    "98"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castell-de-boixadors/'>Castell de Boixadors</a>",
    "Anoia",
    "848",
    "820"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/grony-de-miralles/'>Grony de Miralles</a>",
    "Anoia",
    "866",
    "774"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/miranda-dels-ecos/'>Miranda dels Ecos</a>",
    "Anoia",
    "1223",
    "474"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montgros/'>MontgrÃ²s</a>",
    "Anoia",
    "1133",
    "949"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-castellar-serra-dancosa/'>El Castellar (serra d'Ancosa)</a>",
    "Anoia",
    "943",
    "792"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-daguilera/'>Puig d'Aguilera</a>",
    "Anoia",
    "626",
    "746"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-sant-miquel/'>Puig de Sant Miquel</a>",
    "Anoia",
    "733",
    "1057"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-jeroni/'>Sant Jeroni</a>",
    "Anoia, Bages",
    "1236",
    "1914"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torre-alta-castell-ferran/'>Torre Alta (Castell Ferran)</a>",
    "Anoia",
    "842",
    "795"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cogullo-de-cal-torre/'>CogullÃ³ de Cal Torre</a>",
    "Bages",
    "881",
    "736"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/collbaix/'>Collbaix</a>",
    "Bages",
    "543",
    "1085"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montcau/'>Montcau</a>",
    "Bages, VallÃ¨s Occidental",
    "1057",
    "1708"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-caritat/'>Puig de la Caritat</a>",
    "MoianÃ¨s",
    "1010",
    "1154"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puigsoler/'>Puigsoler</a>",
    "Bages",
    "524",
    "874"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pujol-de-la-mata/'>Pujol de la Mata</a>",
    "Bages",
    "770",
    "752"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-de-sant-salvador-lelefant/'>Roca de Sant Salvador (l'Elefant)</a>",
    "Bages",
    "1156",
    "827"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-sareny/'>Roca Sareny</a>",
    "Bages, VallÃ¨s Occidental",
    "804",
    "768"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-la-torre-o-de-castellnou/'>TurÃ³ de la Torre o de Castellnou</a>",
    "Bages",
    "624",
    "754"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-lescletxa/'>TurÃ³ de l'Escletxa (TurÃ³ de Montconill)</a>",
    "Bages",
    "447",
    "748"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cavall-bernat-de-llaberia/'>Cavall Bernat de Llaberia</a>",
    "Baix Camp",
    "840",
    "761"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-torn/'>El Torn</a>",
    "Baix Camp",
    "152",
    "768"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/miranda-de-puigcerver/'>Miranda de Puigcerver</a>",
    "Baix Camp",
    "834",
    "643"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mola-de-colldejou/'>Mola de Colldejou</a>",
    "Baix Camp",
    "922",
    "1130"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mola-de-genessies/'>Mola de Genessies</a>",
    "Baix Camp, Ribera d'Ebre",
    "711",
    "719"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mola-destat/'>Mola d'Estat</a>",
    "Baix Camp, Conca de BarberÃ ",
    "1136",
    "1102"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mollo-puntaire/'>MollÃ³ Puntaire</a>",
    "Baix Camp",
    "727",
    "773"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/picorandan/'>Picorandan</a>",
    "Baix Camp",
    "991",
    "812"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-gallicant/'>Puig de Gallicant</a>",
    "Baix Camp",
    "1010",
    "687"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-cabrafiga/'>Puig de la Cabrafiga</a>",
    "Baix Camp",
    "614",
    "810"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-den-cama/'>Puig d'en Cama</a>",
    "Baix Camp",
    "717",
    "625"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-pelat/'>Puig Pelat</a>",
    "Baix Camp",
    "1076",
    "726"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-la-baltasana/'>Tossal de la Baltasana</a>",
    "Baix Camp, Conca de BarberÃ ",
    "1201",
    "1267"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/caro/'>Caro</a>",
    "Baix Ebre",
    "1441",
    "893"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-coscollosa/'>La Coscollosa</a>",
    "Baix Ebre",
    "879",
    "441"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lespina/'>L'Espina</a>",
    "Baix Ebre, Terra Alta",
    "1181",
    "431"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/morral-del-cabrafeixet/'>Morral del Cabrafeixet</a>",
    "Baix Ebre",
    "753",
    "484"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-dengrillo/'>Tossal d'EngrillÃ³</a>",
    "Baix Ebre, Terra Alta",
    "1072",
    "718"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/xaquera-o-creu-de-santos/'>Creu de Santos</a>",
    "Baix Ebre, Ribera d'Ebre",
    "942",
    "835"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castell-de-montgri/'>Castell de MontgrÃ­</a>",
    "Baix EmpordÃ ",
    "303",
    "1238"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montclar/'>Montclar</a>",
    "Baix EmpordÃ ",
    "401",
    "897"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-darques/'>Puig d'Arques</a>",
    "Baix EmpordÃ ",
    "533",
    "635"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-gros/'>Puig Gros</a>",
    "Baix EmpordÃ ",
    "325",
    "694"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/quermany-gros/'>Quermany Gros</a>",
    "Baix EmpordÃ ",
    "228",
    "682"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-morella/'>La Morella</a>",
    "Baix Llobregat",
    "594",
    "1256"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/miranda-de-santa-magdalena/'>Miranda de Santa Magdalena</a>",
    "Baix Llobregat",
    "1132",
    "1048"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-cendros/'>Puig CendrÃ³s</a>",
    "Baix Llobregat",
    "499",
    "1085"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-dolorda/'>Puig d'Olorda</a>",
    "Baix Llobregat, BarcelonÃ¨s",
    "436",
    "987"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-madrona/'>Puig Madrona</a>",
    "Baix Llobregat, VallÃ¨s Occidental",
    "341",
    "1045"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-pere-martir/'>Sant Pere MÃ rtir</a>",
    "Baix Llobregat, BarcelonÃ¨s",
    "389",
    "1270"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-ramon/'>Sant Ramon</a>",
    "Baix Llobregat",
    "295",
    "1083"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-salvador-de-les-espases/'>Sant Salvador de les Espases</a>",
    "Baix Llobregat, VallÃ¨s Occidental",
    "413",
    "1412"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-mola/'>La Mola</a>",
    "Baix PenedÃ¨s, TarragonÃ¨s",
    "317",
    "1065"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-cova/'>Puig de la Cova</a>",
    "Baix PenedÃ¨s",
    "672",
    "913"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-sant-antoni/'>Puig de Sant Antoni</a>",
    "Baix PenedÃ¨s",
    "409",
    "819"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/talaia-del-montmell/'>Talaia del Montmell</a>",
    "Baix PenedÃ¨s",
    "861",
    "1302"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-castellar/'>Puig Castellar</a>",
    "BarcelonÃ¨s, VallÃ¨s Occidental",
    "303",
    "1179"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-magarola/'>TurÃ³ de Magarola</a>",
    "BarcelonÃ¨s, VallÃ¨s Occidental",
    "430",
    "1292"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cap-de-la-gallina-pelada/'>Cap de la Gallina Pelada</a>",
    "BerguedÃ ",
    "2321",
    "1537"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cogullo-destela/'>CogullÃ³ d'Estela</a>",
    "BerguedÃ ",
    "1870",
    "1117"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/comabona/'>Comabona</a>",
    "BerguedÃ , Cerdanya",
    "2548",
    "1140"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/els-tossals/'>Els Tossals</a>",
    "BerguedÃ ",
    "1525",
    "554"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-tosa/'>La Tosa</a>",
    "BerguedÃ , Cerdanya",
    "2536",
    "1154"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pedro-de-tubau/'>PedrÃ³ de Tubau</a>",
    "BerguedÃ , RipollÃ¨s",
    "1543",
    "650"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/penyes-altes/'>Penyes Altes</a>",
    "BerguedÃ , Cerdanya",
    "2276",
    "1104"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pollego-superior-pedraforca/'>PollegÃ³ Superior (Pedraforca)</a>",
    "BerguedÃ ",
    "2506",
    "1603"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puigllancada/'>PuigllanÃ§ada</a>",
    "BerguedÃ ",
    "2409",
    "1126"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/salga-aguda/'>Salga Aguda</a>",
    "BerguedÃ ",
    "1172",
    "688"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-marc-de-broca/'>Sant Marc de BrocÃ </a>",
    "BerguedÃ ",
    "1611",
    "567"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sobrepuny/'>Sobrepuny</a>",
    "BerguedÃ ",
    "1653",
    "820"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-les-viudes/'>Tossal de les Viudes</a>",
    "BerguedÃ , SolsonÃ¨s",
    "1379",
    "468"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-carabassa/'>La Carabassa</a>",
    "Cerdanya",
    "2740",
    "565"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-muga/'>La Muga</a>",
    "Cerdanya",
    "2861",
    "500"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puigpedros/'>PuigpedrÃ³s</a>",
    "Cerdanya, Cerdanya Nord",
    "2915",
    "1120"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossa-plana-de-lles-pic-de-la-portelleta/'>Tossa Plana de Lles (pic de la Portelleta)</a>",
    "Andorra, Cerdanya",
    "2905",
    "1015"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/punta-del-curull/'>Punta del Curull</a>",
    "Conca de BarberÃ , Garrigues",
    "1022",
    "1016"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-miquel-de-montclar/'>Sant Miquel de Montclar</a>",
    "Conca de BarberÃ ",
    "948",
    "984"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-gros-de-vallbona/'>Tossal Gros de Vallbona</a>",
    "Conca de BarberÃ , Urgell",
    "803",
    "945"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/els-bessons/'>Els Bessons</a>",
    "Garrigues",
    "593",
    "738"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cabrera/'>Cabrera</a>",
    "Garrotxa, Osona",
    "1308",
    "1314"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/comanegra/'>Comanegra</a>",
    "Garrotxa, Vallespir",
    "1557",
    "1083"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montmajor/'>Montmajor</a>",
    "Garrotxa",
    "1074",
    "575"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-ou/'>Puig Ou</a>",
    "Garrotxa, RipollÃ¨s",
    "1300",
    "804"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puigsacalm/'>Puigsacalm</a>",
    "Garrotxa",
    "1514",
    "1651"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puigsallanca/'>PuigsallanÃ§a</a>",
    "Garrotxa",
    "1027",
    "806"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-roc/'>Sant Roc</a>",
    "Garrotxa, GironÃ¨s, Selva",
    "598",
    "710"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/volca-del-croscat/'>VolcÃ  del Croscat</a>",
    "Garrotxa",
    "789",
    "986"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castell-de-sant-miquel/'>Castell de Sant Miquel</a>",
    "GironÃ¨s",
    "385",
    "943"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/els-angels/'>Els Ã€ngels</a>",
    "GironÃ¨s",
    "483",
    "987"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montigalar/'>Montigalar</a>",
    "GironÃ¨s",
    "464",
    "616"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-cadiretes/'>Puig Cadiretes</a>",
    "GironÃ¨s, Selva",
    "519",
    "888"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castell-de-burriac/'>Castell de Burriac</a>",
    "Maresme",
    "392",
    "1449"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montalt/'>Montalt</a>",
    "Maresme",
    "597",
    "1095"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montbarbat/'>Montbarbat</a>",
    "Maresme, Selva",
    "328",
    "662"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pedracastell-o-creu-de-canet/'>Pedracastell o Creu de Canet</a>",
    "Maresme",
    "287",
    "854"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-montgat/'>TurÃ³ de Montgat</a>",
    "Maresme",
    "40",
    "996"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-den-galzeran-o-den-mates/'>TurÃ³ d'en Galzeran o d'en Mates</a>",
    "Maresme, VallÃ¨s Oriental",
    "484",
    "1012"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-donofre-arnau/'>TurÃ³ d'Onofre Arnau</a>",
    "Maresme",
    "131",
    "919"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-montsianell/'>El Montsianell</a>",
    "MontsiÃ ",
    "293",
    "631"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-negrell/'>El Negrell</a>",
    "MontsiÃ ",
    "1345",
    "479"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torreta-del-montsia/'>Torreta del MontsiÃ </a>",
    "MontsiÃ ",
    "763",
    "824"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-dels-tres-reis/'>Tossal dels Tres Reis</a>",
    "MontsiÃ ",
    "1350",
    "733"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/los-picons/'>Los Picons</a>",
    "Noguera",
    "951",
    "379"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montmagastre/'>Montmagastre</a>",
    "Noguera",
    "762",
    "646"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pala-alta/'>Pala Alta</a>",
    "Noguera",
    "947",
    "704"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/penya-sant-alis/'>Penya Sant AlÃ­s</a>",
    "Noguera, Pallars JussÃ ",
    "1675",
    "745"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-grialo/'>Puig de GrialÃ³</a>",
    "Noguera",
    "667",
    "607"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-milla/'>Puig de MillÃ </a>",
    "Noguera",
    "1025",
    "418"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-roja/'>Roca Roja</a>",
    "Noguera, Pallars JussÃ ",
    "1239",
    "502"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-mamet/'>Sant Mamet</a>",
    "Noguera",
    "1391",
    "626"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-mirapallars/'>Tossal de Mirapallars</a>",
    "Noguera, Pallars JussÃ ",
    "1672",
    "689"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/bellmunt/'>Bellmunt</a>",
    "Osona",
    "1248",
    "1340"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castell-de-milany/'>Castell de Milany</a>",
    "Osona, RipollÃ¨s",
    "1529",
    "1150"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/creu-de-gurb/'>Creu de Gurb</a>",
    "Osona",
    "842",
    "1247"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/els-munts/'>Els Munts</a>",
    "Osona",
    "1057",
    "807"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lenclusa/'>L'Enclusa</a>",
    "Osona",
    "867",
    "850"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/matagalls/'>Matagalls</a>",
    "Osona, VallÃ¨s Oriental",
    "1697",
    "1920"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-forca/'>Puig de la ForÃ§a</a>",
    "Osona",
    "740",
    "778"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-les-aligues/'>Puig de les Ã€ligues</a>",
    "Osona",
    "1344",
    "896"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/rocallarga/'>Rocallarga</a>",
    "Osona",
    "1187",
    "1127"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/santa-magdalena-de-cambrils/'>Santa Magdalena de Cambrils</a>",
    "Osona, RipollÃ¨s",
    "1547",
    "757"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-bellver/'>TurÃ³ de Bellver</a>",
    "MoianÃ¨s",
    "1045",
    "920"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cap-de-boumort/'>Cap de Boumort</a>",
    "Pallars JussÃ ",
    "2077",
    "513"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/gallinova/'>Gallinova</a>",
    "Pallars JussÃ ",
    "1687",
    "276"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montllobar/'>Montllobar</a>",
    "Pallars JussÃ ",
    "1104",
    "390"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montsent-de-pallars/'>Montsent de Pallars</a>",
    "Pallars JussÃ , Pallars SobirÃ ",
    "2883",
    "552"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-filia-tossal-de-paiasso/'>Pic de FiliÃ  (Tossal de Paiasso)</a>",
    "Pallars JussÃ ",
    "2772",
    "195"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-peguera/'>Pic de Peguera</a>",
    "Pallars JussÃ , Pallars SobirÃ ",
    "2983",
    "439"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-subenuix/'>Pic de Subenuix</a>",
    "Pallars JussÃ , Pallars SobirÃ ",
    "2950",
    "148"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pica-de-cervi/'>Pica de CervÃ­</a>",
    "Pallars JussÃ ",
    "2753",
    "237"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pui-de-lleras/'>Pui de LlerÃ s</a>",
    "Pallars JussÃ ",
    "1692",
    "506"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-de-sant-aventi/'>Roc de Sant AventÃ­</a>",
    "Pallars JussÃ , Pallars SobirÃ ",
    "1480",
    "377"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-corneli/'>Sant Corneli</a>",
    "Pallars JussÃ ",
    "1351",
    "518"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-la-cometa/'>Tuc de la Cometa</a>",
    "Pallars JussÃ , Pallars SobirÃ ",
    "2445",
    "306"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/campirme/'>Campirme</a>",
    "Pallars SobirÃ ",
    "2633",
    "524"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/gran-encantat/'>Gran Encantat</a>",
    "Pallars SobirÃ ",
    "2749",
    "161"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lo-tesol-teso-de-son/'>Lo TÃ©sol (TesÃ³ de Son)</a>",
    "Pallars SobirÃ ",
    "2700",
    "273"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montcaubo-lo-calbo/'>Montcaubo (lo Calbo)</a>",
    "Pallars SobirÃ ",
    "2291",
    "344"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/monteixo/'>Monteixo</a>",
    "Pallars SobirÃ ",
    "2905",
    "421"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mont-roig/'>Mont-roig</a>",
    "Pallars SobirÃ ",
    "2864",
    "220"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-certascan/'>Pic de Certascan</a>",
    "Pallars SobirÃ ",
    "2853",
    "401"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-clavera/'>Pic de Clavera</a>",
    "Pallars SobirÃ ",
    "2721",
    "114"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-maniga/'>Pic de MÃ niga</a>",
    "Pallars SobirÃ ",
    "2517",
    "253"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-medacorba/'>Pic de Medacorba</a>",
    "Andorra, Pallars SobirÃ ",
    "2915",
    "209"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-moredo/'>Pic de Moredo</a>",
    "Pallars SobirÃ ",
    "2766",
    "94"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-pilas/'>Pic de PilÃ s</a>",
    "Pallars SobirÃ ",
    "2656",
    "105"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-sotllo/'>Pic de Sotllo</a>",
    "Pallars SobirÃ ",
    "3073",
    "344"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pica-destats/'>Pica d'Estats</a>",
    "Pallars SobirÃ ",
    "3144",
    "1213"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pica-roja/'>Pica Roja</a>",
    "Pallars SobirÃ ",
    "2903",
    "173"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pics-de-bassiero/'>Pics de Bassiero (Occidental)</a>",
    "Pallars SobirÃ ",
    "2903",
    "137"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torreta-de-lorri/'>Torreta de l'Orri</a>",
    "Pallars SobirÃ ",
    "2436",
    "757"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-la-llanca/'>Tuc de la LlanÃ§a</a>",
    "Pallars SobirÃ ",
    "2659",
    "348"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-marimanya/'>Tuc de Marimanya</a>",
    "Pallars SobirÃ , Val d'Aran",
    "2679",
    "199"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-ratera/'>Tuc de Ratera</a>",
    "Pallars SobirÃ , Val d'Aran",
    "2861",
    "403"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-fita-alta/'>La Fita Alta</a>",
    "Pla d'Urgell",
    "289",
    "899"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-patllari/'>Sant Patllari</a>",
    "Pla de l'Estany",
    "646",
    "911"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-cogulla-montsant/'>La Cogulla (Montsant)</a>",
    "Priorat",
    "1062",
    "577"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montalt-punta-nord/'>Montalt (punta nord)</a>",
    "Priorat, Ribera d'Ebre",
    "766",
    "444"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-corbatera/'>Roca Corbatera</a>",
    "Priorat",
    "1163",
    "1180"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/coll-de-pins/'>Coll de Pins</a>",
    "Ribera d'Ebre",
    "500",
    "501"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-picossa/'>La Picossa</a>",
    "Ribera d'Ebre",
    "499",
    "625"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-tossa-tivissa/'>La Tossa (Tivissa)</a>",
    "Ribera d'Ebre",
    "718",
    "749"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lo-tormo/'>Lo Tormo (Lo pilÃ³)</a>",
    "Ribera d'Ebre",
    "523",
    "656"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/balandrau/'>Balandrau</a>",
    "RipollÃ¨s",
    "2585",
    "1402"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/bastiments/'>Bastiments</a>",
    "Conflent, RipollÃ¨s",
    "2881",
    "1667"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/costa-pubilla-o-pla-de-pujalts/'>Costa Pubilla o Pla de Pujalts</a>",
    "RipollÃ¨s",
    "2056",
    "950"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/costabona/'>Costabona</a>",
    "RipollÃ¨s, Vallespir",
    "2465",
    "1204"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/les-borregues/'>Les Borregues</a>",
    "RipollÃ¨s",
    "2693",
    "672"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/noufonts/'>Noufonts</a>",
    "Conflent, RipollÃ¨s",
    "2861",
    "891"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-cornador/'>Puig Cornador</a>",
    "RipollÃ¨s",
    "1229",
    "795"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-bestreca/'>Puig de BestracÃ </a>",
    "RipollÃ¨s",
    "1056",
    "584"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-les-agudes/'>Puig de les Agudes</a>",
    "RipollÃ¨s",
    "1976",
    "673"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-estela/'>Puig Estela</a>",
    "RipollÃ¨s",
    "2013",
    "964"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puigmal/'>Puigmal</a>",
    "Cerdanya Nord, RipollÃ¨s",
    "2910",
    "1848"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/taga/'>Taga</a>",
    "RipollÃ¨s",
    "2040",
    "1638"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torreneules/'>Torreneules</a>",
    "RipollÃ¨s",
    "2713",
    "647"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-la-creu/'>Tossal de la Creu</a>",
    "Segarra",
    "658",
    "748"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-suro/'>Tossal de SurÃ³</a>",
    "Segarra",
    "828",
    "696"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montmeneu/'>Punta de Montmeneu</a>",
    "SegriÃ ",
    "495",
    "658"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-la-moradilla/'>Tossal de la Moradilla</a>",
    "SegriÃ ",
    "243",
    "651"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-far/'>El Far</a>",
    "Selva",
    "1124",
    "820"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/largimon/'>L'Argimon</a>",
    "Selva",
    "465",
    "688"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/les-agudes/'>Les Agudes</a>",
    "Selva, VallÃ¨s Oriental",
    "1705",
    "1830"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-benet/'>Sant Benet</a>",
    "Selva",
    "1150",
    "686"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-miquel-de-solterra/'>Sant Miquel de Solterra</a>",
    "Selva",
    "1203",
    "1158"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-montsoriu/'>TurÃ³ de Montsoriu</a>",
    "Selva",
    "633",
    "1058"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-cogul/'>El Cogul</a>",
    "SolsonÃ¨s",
    "1526",
    "988"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-les-morreres/'>Puig de les Morreres</a>",
    "SolsonÃ¨s",
    "2211",
    "836"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-sobira/'>Puig SobirÃ </a>",
    "SolsonÃ¨s",
    "1938",
    "411"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/serra-de-pinos/'>Serra de PinÃ³s</a>",
    "SolsonÃ¨s",
    "928",
    "717"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-cavaller/'>Puig Cavaller</a>",
    "Terra Alta",
    "706",
    "599"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/punta-redona/'>Punta Redona</a>",
    "Terra Alta",
    "659",
    "526"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roques-de-benet-el-castell/'>Roques de Benet (el Castell)</a>",
    "Terra Alta",
    "1017",
    "784"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/santa-barbara/'>Santa BÃ rbara</a>",
    "Terra Alta",
    "752",
    "811"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pilar-dalmenara/'>Pilar d'Almenara</a>",
    "Urgell",
    "459",
    "990"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/malh-des-pois-la-forcanada/'>Malh des Pois (la Forcanada)</a>",
    "Val d'Aran",
    "2883",
    "61"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mauberme/'>MaubÃ¨rme</a>",
    "Val d'Aran",
    "2882",
    "355"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montardo/'>Montardo</a>",
    "Val d'Aran",
    "2833",
    "749"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montcorbison/'>Montcorbison</a>",
    "Val d'Aran",
    "2173",
    "734"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montlude/'>Montlude</a>",
    "Val d'Aran",
    "2518",
    "316"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossau-de-mar/'>Tossau de Mar</a>",
    "Val d'Aran",
    "2750",
    "73"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-barlonguera/'>Tuc de BarlonguÃ¨ra</a>",
    "Val d'Aran",
    "2802",
    "148"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-molieres/'>Tuc de MoliÃ¨res</a>",
    "Val d'Aran",
    "3010",
    "696"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-dera-entecada/'>Tuc d'Era Entecada</a>",
    "Val d'Aran",
    "2269",
    "238"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-dera-pincela/'>Tuc dera PincÃ¨la</a>",
    "Val d'Aran",
    "2536",
    "253"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-deth-plan-deth-ome-vacanera/'>Tuc deth Plan deth Ome (Vacanera)</a>",
    "Val d'Aran",
    "2194",
    "155"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-deth-port-de-vielha/'>Tuc deth Port de Vielha</a>",
    "Val d'Aran",
    "2606",
    "451"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-gran-dera-sendrosa/'>Tuc Gran dera Sendrosa</a>",
    "Val d'Aran",
    "2703",
    "179"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castellsapera/'>Castellsapera</a>",
    "VallÃ¨s Occidental",
    "939",
    "1349"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-mola-de-sant-llorenc-del-munt/'>La Mola de Sant LlorenÃ§ del Munt</a>",
    "VallÃ¨s Occidental",
    "1102",
    "1889"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-creu/'>Puig de la Creu</a>",
    "VallÃ¨s Occidental",
    "668",
    "1087"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-sadurni-de-gallifa/'>Sant SadurnÃ­ de Gallifa</a>",
    "VallÃ¨s Occidental",
    "942",
    "1169"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-del-ros/'>TurÃ³ del Ros</a>",
    "VallÃ¨s Occidental",
    "635",
    "770"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-del-vent/'>Pic del Vent</a>",
    "VallÃ¨s Oriental",
    "816",
    "1238"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puiggracios/'>PuiggraciÃ³s</a>",
    "VallÃ¨s Oriental",
    "808",
    "862"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tagamanent/'>Tagamanent</a>",
    "VallÃ¨s Oriental",
    "1056",
    "1560"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-del-samont/'>TurÃ³ del Samont</a>",
    "VallÃ¨s Oriental",
    "1273",
    "849"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/alt-de-juclar/'>Alt de Juclar</a>",
    "Andorra",
    "2588",
    "160"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/alt-del-griu/'>Alt del Griu</a>",
    "Andorra",
    "2874",
    "356"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/casamanya-nord/'>Casamanya Nord</a>",
    "Andorra",
    "2750",
    "741"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/comapedrosa/'>Comapedrosa</a>",
    "Andorra",
    "2942",
    "820"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montmalus/'>MontmalÃºs</a>",
    "Andorra",
    "2781",
    "633"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-cataperdis/'>Pic de CataperdÃ­s</a>",
    "Andorra",
    "2805",
    "338"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-font-blanca/'>Pic de Font Blanca</a>",
    "Andorra",
    "2903",
    "317"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-la-serrera/'>Pic de la Serrera</a>",
    "Andorra",
    "2912",
    "482"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-descobes/'>Pic d'Escobes</a>",
    "Andorra",
    "2780",
    "209"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-negre-denvalira/'>Pic Negre d'Envalira</a>",
    "Andorra, Cerdanya Nord",
    "2822",
    "690"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-mele/'>Roc MelÃ©</a>",
    "Andorra",
    "2811",
    "193"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tosa-del-braibal/'>Tossa del Braibal</a>",
    "Andorra",
    "2657",
    "243"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tristaina/'>Tristaina</a>",
    "Andorra",
    "2878",
    "696"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-baixollada/'>Pic de Baixollada</a>",
    "Capcir",
    "2546",
    "166"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-peric/'>Puig Peric</a>",
    "Capcir, Cerdanya Nord",
    "2810",
    "605"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cambra-dase/'>Cambra d'Ase</a>",
    "Cerdanya Nord",
    "2750",
    "627"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/carlit/'>Carlit</a>",
    "Cerdanya Nord",
    "2921",
    "1080"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-font-freda/'>Pic de Font Freda</a>",
    "Cerdanya Nord",
    "2738",
    "215"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-dels-moros/'>Pic dels Moros</a>",
    "Cerdanya Nord",
    "2137",
    "681"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-grava/'>Puig de la Grava</a>",
    "Cerdanya Nord",
    "2671",
    "192"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-pedros-de-lanos/'>Puig PedrÃ³s de LanÃ³s</a>",
    "Cerdanya Nord",
    "2842",
    "209"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-del-boc/'>Roc del Boc</a>",
    "Cerdanya Nord",
    "2774",
    "119"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torre-deina/'>Torre d'Eina</a>",
    "Cerdanya Nord, Conflent",
    "2830",
    "704"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-bell-lloc/'>TurÃ³ de Bell-lloc</a>",
    "Cerdanya Nord",
    "1702",
    "711"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/canigo/'>CanigÃ³</a>",
    "Conflent",
    "2784",
    "1107"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-linfern/'>Pic de l'Infern</a>",
    "Conflent",
    "2870",
    "790"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-raco-gros/'>Pic de RacÃ³ Gros</a>",
    "Conflent",
    "2782",
    "160"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-gallinas/'>Puig de GallinÃ s</a>",
    "Conflent",
    "2624",
    "200"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-les-tres-esteles/'>Puig de les Tres Esteles</a>",
    "Conflent",
    "2099",
    "256"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-lestella/'>Puig de l'Estella</a>",
    "Conflent, Vallespir",
    "1778",
    "260"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-de-madres/'>Roc de Madres</a>",
    "Conflent",
    "2469",
    "401"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-gelera/'>Roca Gelera</a>",
    "Conflent",
    "1110",
    "243"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-dormidor/'>Tuc Dormidor</a>",
    "Conflent",
    "1843",
    "208"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/forca-real/'>ForÃ§a Real</a>",
    "RossellÃ³",
    "507",
    "401"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montolier-de-perellos/'>Montolier de PerellÃ³s</a>",
    "RossellÃ³",
    "707",
    "323"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-de-mallorca/'>Roc de Mallorca</a>",
    "RossellÃ³",
    "443",
    "375"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torre-de-madeloc/'>Torre de Madeloc</a>",
    "RossellÃ³",
    "656",
    "673"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torre-del-far/'>Torre del Far</a>",
    "RossellÃ³",
    "498",
    "315"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-sant-cristau/'>Puig de Sant Cristau</a>",
    "RossellÃ³, Vallespir",
    "1015",
    "465"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-tretzevents/'>Puig de Tretzevents</a>",
    "Conflent, Vallespir",
    "2731",
    "234"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torres-de-cabrenc/'>Torres de CabrenÃ§</a>",
    "Vallespir",
    "1344",
    "380"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-cogullo-de-cabra/'>El CogullÃ³ de Cabra</a>",
    "Alt Camp",
    "881",
    "941"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/clapi-vell/'>ClapÃ­ Vell</a>",
    "Alt PenedÃ¨s",
    "703",
    "497"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lalbarda-castellana/'>L'Albarda Castellana</a>",
    "Baix Llobregat",
    "1178",
    "683"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/miranda-de-llaberia/'>Miranda de Llaberia</a>",
    "Baix Camp, Ribera d'Ebre",
    "919",
    "617"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-vicenc/'>Puig VicenÃ§</a>",
    "Baix Llobregat",
    "468",
    "559"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/punta-de-laigua/'>Punta de l'Aigua</a>",
    "Baix Ebre, Terra Alta",
    "1092",
    "374"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-de-sant-salvador/'>Roc de Sant Salvador</a>",
    "Vallespir",
    "1235",
    "154"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-baciver/'>Tuc de BacivÃ¨r</a>",
    "Val d'Aran",
    "2645",
    "177"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-samont/'>Tuc de Somont</a>",
    "Val d'Aran",
    "2508",
    "160"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-les-tres-creus/'>TurÃ³ de la Pola (o de les Tres Creus)</a>",
    "Bages",
    "930",
    "756"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/besiberri-del-sud/'>Besiberri Sud</a>",
    "Alta RibagorÃ§a",
    "3023",
    "195"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-coma-dor/'>Puig de Coma d'Or</a>",
    "Cerdanya Nord",
    "2826",
    "156"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-lestanyo/'>Pic de l'EstanyÃ³</a>",
    "Andorra",
    "2915",
    "160"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-perafita/'>Tossal de la Truita (Pic de Perafita)</a>",
    "Andorra, Cerdanya",
    "2753",
    "302"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-bovinar/'>Tossal Bovinar</a>",
    "Cerdanya",
    "2842",
    "134"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-dels-bufadors/'>Puig dels Bufadors</a>",
    "Alt EmpordÃ ",
    "432",
    "255"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-laliga-cap-de-creus/'>Puig de l'Ã€liga (Cap de Creus)</a>",
    "Alt EmpordÃ ",
    "463",
    "268"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/santa-magdalena/'>Santa Magdalena</a>",
    "Alt EmpordÃ ",
    "526",
    "233"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-falco/'>Puig FalcÃ³</a>",
    "Alt EmpordÃ ",
    "1097",
    "162"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-segalar/'>Puig Segalar</a>",
    "Alt EmpordÃ , Baix EmpordÃ ",
    "175",
    "311"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossa-despinau/'>Tossa d'Espinau</a>",
    "Alt EmpordÃ , Garrotxa",
    "1087",
    "246"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-cervera/'>Puig de Cervera</a>",
    "Alt EmpordÃ , RossellÃ³",
    "207",
    "251"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-den-jorda/'>Puig d'en JordÃ </a>",
    "Alt EmpordÃ , RossellÃ³",
    "754",
    "192"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-dels-pruners/'>Puig dels Pruners</a>",
    "Alt EmpordÃ , Vallespir",
    "832",
    "181"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-balinyo/'>Tossal de BalinyÃ³</a>",
    "Alt Urgell",
    "1211",
    "156"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-de-les-tres-creus/'>Roc de les Tres Creus</a>",
    "Alt Urgell",
    "854",
    "164"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-quiri/'>Sant Quiri</a>",
    "Alt Urgell",
    "1503",
    "144"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/penya-aguda/'>Penya Aguda</a>",
    "Alt Urgell",
    "1523",
    "164"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/loratori/'>l'Oratori</a>",
    "Alt Urgell",
    "1757",
    "164"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/serrat-de-carrasquers/'>Serrat de Carrasquers</a>",
    "Alt Urgell",
    "1429",
    "119"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-roi/'>Roc Roi</a>",
    "Alt Urgell",
    "2020",
    "116"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-bades/'>Tossal de BadÃ©s</a>",
    "Alt Urgell",
    "1818",
    "140"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cap-de-pla-redon/'>Cap de Pla Redon</a>",
    "Alt Urgell",
    "1846",
    "79"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-de-cogul/'>Roc de Cogul</a>",
    "Alt Urgell",
    "885",
    "222"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-lleto/'>Tossal de LletÃ³</a>",
    "Alt Urgell",
    "1631",
    "137"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-costa-cabirolera/'>Pic de Costa Cabirolera</a>",
    "Alt Urgell, BerguedÃ , Cerdanya",
    "2604",
    "286"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-punco/'>TurÃ³ PunÃ§Ã³</a>",
    "Alt Urgell, Cerdanya",
    "2493",
    "208"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-de-migdia-serra-del-verd/'>Roca de Migdia (Serra del Verd)</a>",
    "Alt Urgell, SolsonÃ¨s",
    "1870",
    "143"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-del-coscollo/'>Roca del CoscollÃ³</a>",
    "Alt Urgell, SolsonÃ¨s",
    "1299",
    "172"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-des-carants/'>Tuc des Carants</a>",
    "Alta RibagorÃ§a",
    "2791",
    "75"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-contraix/'>Pic de Contraix</a>",
    "Alta RibagorÃ§a",
    "2958",
    "30"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/punta-senyalada/'>Punta Senyalada</a>",
    "Alta RibagorÃ§a",
    "2952",
    "22"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-roi/'>Pic Roi</a>",
    "Alta RibagorÃ§a",
    "2585",
    "61"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/laut/'>l'AÃ¼t</a>",
    "Alta RibagorÃ§a",
    "2532",
    "104"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cap-de-gelada/'>Cap de Gelada</a>",
    "Alta RibagorÃ§a",
    "2449",
    "134"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lavedoga-dadons/'>l'Avedoga d'Adons</a>",
    "Alta RibagorÃ§a, Pallars JussÃ ",
    "1839",
    "187"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-mariolo-pic-de-neriolo/'>Pic de Mariolo (Pic de Neriolo)</a>",
    "Alta RibagorÃ§a, Pallars JussÃ ",
    "2857",
    "48"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-gros-serra-de-sant-gervas/'>Tossal Gros (Serra de Sant GervÃ s)</a>",
    "Alta RibagorÃ§a, Pallars JussÃ ",
    "1546",
    "97"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-des-monges/'>Tuc des Monges</a>",
    "Alta RibagorÃ§a, Val d'Aran",
    "2699",
    "44"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-la-contesa/'>Tuc de la Contesa</a>",
    "Alta RibagorÃ§a, Val d'Aran",
    "2780",
    "20"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-ribereta/'>Tuc de Ribereta</a>",
    "Alta RibagorÃ§a, Val d'Aran",
    "2676",
    "44"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/miranda-del-princep/'>Miranda del PrÃ­ncep</a>",
    "Anoia",
    "993",
    "256"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-can-dolcet/'>TurÃ³ de Can Dolcet</a>",
    "Anoia, Baix Llobregat",
    "416",
    "395"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-del-mal-pas/'>TurÃ³ del Mal Pas</a>",
    "Bages",
    "755",
    "322"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-lermita/'>TurÃ³ de l'ErmitÃ </a>",
    "Bages",
    "595",
    "357"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-alter/'>Puig-alter</a>",
    "Bages",
    "522",
    "341"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-garrofi/'>el GarrofÃ­</a>",
    "Bages",
    "617",
    "365"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-bres/'>el Bres</a>",
    "Baix Camp",
    "525",
    "292"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/serret-del-cisa/'>Serret del Cisa</a>",
    "Baix Camp",
    "542",
    "272"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/santa-barbara-escornalbou/'>Santa BÃ rbara (Escornalbou)</a>",
    "Baix Camp",
    "641",
    "285"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-lalzina/'>Tossal de l'Alzina</a>",
    "Baix Camp",
    "697",
    "175"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/punta-del-pallars/'>Punta del Pallars</a>",
    "Baix Camp",
    "551",
    "237"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-moleta/'>la Moleta</a>",
    "Baix Ebre",
    "812",
    "224"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mola-castellona/'>Mola Castellona</a>",
    "Baix Ebre",
    "1034",
    "117"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lo-caramull/'>lo Caramull</a>",
    "Baix Ebre",
    "429",
    "107"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montaspre/'>Montaspre</a>",
    "Baix Ebre",
    "528",
    "156"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/catinell/'>Catinell</a>",
    "Baix Ebre, MontsiÃ ",
    "1350",
    "98"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-de-la-barca-les-picossies/'>Les PicÃ²ssies</a>",
    "Baix Ebre, Ribera d'Ebre",
    "772",
    "144"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-montagut/'>Tossal de Montagut</a>",
    "Baix Ebre, Ribera d'Ebre",
    "394",
    "150"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/moleta-de-les-canals/'>Moleta de les Canals</a>",
    "Baix Ebre, Terra Alta",
    "1070",
    "119"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tosseta-rasa/'>Tosseta Rasa</a>",
    "Baix Ebre, Terra Alta",
    "1217",
    "140"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-maura/'>Roca Maura</a>",
    "Baix EmpordÃ ",
    "225",
    "366"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-les-cols/'>Puig de les Cols</a>",
    "Baix EmpordÃ ",
    "417",
    "372"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/les-solius/'>les Solius</a>",
    "Baix Llobregat",
    "533",
    "378"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-francas/'>Puig FrancÃ s</a>",
    "Baix PenedÃ¨s",
    "551",
    "368"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-den-mora-turo-del-carmel/'>TurÃ³ d'en MÃ³ra (TurÃ³ del Carmel)</a>",
    "BarcelonÃ¨s",
    "266",
    "429"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/serrat-voltor/'>Serrat Voltor</a>",
    "BerguedÃ ",
    "2282",
    "359"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/serrat-de-sant-isidre/'>Serrat de Sant Isidre</a>",
    "BerguedÃ ",
    "1117",
    "261"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/serrat-de-migdia-serrat-de-picancel/'>Serrat de Migdia (Serrat de Picancel)</a>",
    "BerguedÃ ",
    "1082",
    "272"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-salvador/'>Sant Salvador</a>",
    "BerguedÃ ",
    "1157",
    "294"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pollego-inferior-pedraforca/'>PollegÃ³ Inferior (Pedraforca)</a>",
    "BerguedÃ ",
    "2445",
    "182"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-del-joc-roca-de-la-devesa-jussana/'>Roca del Joc (Roca de la Devesa Jussana)</a>",
    "BerguedÃ ",
    "1615",
    "265"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montsent-serrat-de-picancel/'>Montsent (Serrat de Picancel)</a>",
    "BerguedÃ ",
    "963",
    "251"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cap-de-la-boixassa/'>Cap de la Boixassa</a>",
    "BerguedÃ ",
    "1820",
    "242"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/serrat-de-la-madrona/'>Serrat de la Madrona</a>",
    "BerguedÃ ",
    "682",
    "337"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-llisoi/'>Tossal Llisol</a>",
    "BerguedÃ ",
    "1326",
    "337"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-creueta/'>la Creueta</a>",
    "BerguedÃ , RipollÃ¨s",
    "2067",
    "342"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-gros-pelat-de-talltendre/'>Tossal Gros (Pelat de Talltendre)</a>",
    "Cerdanya",
    "2256",
    "174"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-gran/'>Roca Gran</a>",
    "Cerdanya",
    "2088",
    "144"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castell-de-llivia/'>Castell de LlÃ­via</a>",
    "Cerdanya",
    "1358",
    "343"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tosseta-de-lesquella-pic-de-calm-colomer/'>Tosseta de l'Esquella (Pic de Calm Colomer)</a>",
    "Cerdanya, Cerdanya Nord",
    "2869",
    "107"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/punta-del-general/'>Punta del General</a>",
    "Garrigues, Priorat",
    "923",
    "225"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-lladre/'>Roca Lladre</a>",
    "Garrotxa",
    "907",
    "352"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-miquel-del-mont/'>Sant Miquel del Mont</a>",
    "Garrotxa",
    "793",
    "326"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-cubell/'>Puig Cubell</a>",
    "Garrotxa, Osona",
    "1488",
    "299"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-grau/'>Sant Grau</a>",
    "GironÃ¨s",
    "500",
    "303"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montpalau/'>Montpalau</a>",
    "Maresme",
    "264",
    "373"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/codol-del-castellar/'>CÃ²dol del Castellar</a>",
    "MoianÃ¨s",
    "832",
    "328"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-cogula/'>la Cogula</a>",
    "MontsiÃ ",
    "406",
    "202"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/els-quatre-mollons/'>els Quatre Mollons</a>",
    "MontsiÃ ",
    "433",
    "221"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-portella-del-pinell/'>la Portella del Pinell</a>",
    "MontsiÃ ",
    "1098",
    "82"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-cogullo/'>el CogullÃ³</a>",
    "Noguera",
    "1002",
    "191"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mont-roig-cim-de-les-altures/'>Mont-roig (Cim de les Altures)</a>",
    "Noguera",
    "715",
    "233"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-sant-jordi/'>Tossal de Sant Jordi</a>",
    "Noguera",
    "740",
    "219"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montero/'>MonterÃ³</a>",
    "Noguera",
    "574",
    "240"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torre-de-les-conclues/'>Torre de les Conclues</a>",
    "Noguera",
    "699",
    "127"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/punta-dossos/'>Punta d'Ossos</a>",
    "Noguera",
    "1014",
    "169"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/malera/'>Malera</a>",
    "Noguera",
    "877",
    "180"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/munt-de-montsonis/'>Munt de MontsonÃ­s</a>",
    "Noguera",
    "591",
    "266"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-mormur/'>Tossal de Mormur</a>",
    "Noguera",
    "326",
    "297"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lo-peladet/'>lo Peladet</a>",
    "Noguera, Pallars JussÃ ",
    "1471",
    "174"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-del-far/'>Puig del Far</a>",
    "Osona",
    "832",
    "362"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/serrat-alt/'>Serrat Alt</a>",
    "Osona",
    "830",
    "351"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castell-de-besora/'>Castell de Besora</a>",
    "Osona",
    "1030",
    "441"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-marti-xic-castell-de-voltrega/'>Sant MartÃ­ Xic (Castell de VoltregÃ )</a>",
    "Osona",
    "859",
    "396"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-del-pou-den-sala/'>TurÃ³ del Pou d'en Sala</a>",
    "Osona",
    "1265",
    "361"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castell-de-lluca/'>Castell de LluÃ§Ã </a>",
    "LluÃ§anÃ¨s ",
    "895",
    "355"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cap-de-carreu/'>Cap de Carreu</a>",
    "Pallars JussÃ ",
    "1749",
    "100"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/rocalta/'>Rocalta</a>",
    "Pallars JussÃ ",
    "1489",
    "122"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-codonyac/'>Tossal de Codonyac</a>",
    "Pallars JussÃ ",
    "1425",
    "107"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-tort/'>Pic Tort</a>",
    "Pallars JussÃ ",
    "2886",
    "51"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-lespada/'>Pic de l'Espada</a>",
    "Pallars JussÃ ",
    "2549",
    "119"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-llena/'>Pic de Llena</a>",
    "Pallars JussÃ ",
    "2686",
    "51"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/santa-barbara-vall-fosca/'>Santa BÃ rbara (Vall Fosca)</a>",
    "Pallars JussÃ ",
    "1613",
    "138"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-codo/'>el CodÃ³</a>",
    "Pallars JussÃ ",
    "1327",
    "156"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-la-mainera/'>Pic de la Mainera</a>",
    "Pallars JussÃ , Pallars SobirÃ ",
    "2909",
    "76"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-del-puial/'>Tossal del Puial</a>",
    "Pallars SobirÃ ",
    "1913",
    "120"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pui-durdosa/'>Pui d'Urdosa</a>",
    "Pallars SobirÃ ",
    "2226",
    "87"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-gerri/'>Pic de Gerri</a>",
    "Pallars SobirÃ ",
    "2859",
    "19"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-canalbona/'>Pic de Canalbona</a>",
    "Pallars SobirÃ ",
    "2965",
    "33"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-flamisella/'>Pic de Flamisella</a>",
    "Pallars SobirÃ ",
    "2782",
    "38"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pui-de-cassibros/'>Pui de CassibrÃ³s</a>",
    "Pallars SobirÃ ",
    "2085",
    "81"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pui-tabaca/'>Pui Tabaca</a>",
    "Pallars SobirÃ ",
    "1718",
    "112"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-saboredo/'>Pic de Saboredo</a>",
    "Pallars SobirÃ ",
    "2830",
    "63"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montsaliente/'>Montsaliente</a>",
    "Pallars SobirÃ ",
    "2890",
    "19"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pui-de-la-bonaigua/'>Pui de la Bonaigua</a>",
    "Pallars SobirÃ ",
    "2778",
    "19"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montarenyo-de-boldis/'>Montarenyo de BoldÃ­s</a>",
    "Pallars SobirÃ ",
    "2593",
    "46"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-baborte/'>Pic de Baborte</a>",
    "Pallars SobirÃ ",
    "2934",
    "45"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-colatx/'>Pic de Colatx</a>",
    "Pallars SobirÃ ",
    "2570",
    "29"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/cap-de-broate/'>Cap de Broate</a>",
    "Pallars SobirÃ ",
    "2741",
    "19"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-mariola/'>Pic de Mariola</a>",
    "Pallars SobirÃ ",
    "2663",
    "17"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-ventolau/'>Pic de Ventolau</a>",
    "Pallars SobirÃ ",
    "2851",
    "95"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-montalt/'>Pic de Montalt</a>",
    "Pallars SobirÃ ",
    "2496",
    "38"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-quenca/'>Pic de QÃ¼enca</a>",
    "Pallars SobirÃ ",
    "2639",
    "21"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-la-plana/'>Pic de la Plana</a>",
    "Pallars SobirÃ ",
    "2493",
    "100"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-de-laliga-la-geganta-adormida/'>Tossal de l'Ã€liga (la Geganta Adormida)</a>",
    "Pallars SobirÃ ",
    "1315",
    "192"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-del-portarro/'>Pic del PortarrÃ³</a>",
    "Pallars SobirÃ ",
    "2734",
    "78"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pui-de-linya/'>Pui de Linya</a>",
    "Pallars SobirÃ ",
    "2870",
    "35"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/les-picardes/'>les Picardes</a>",
    "Pallars SobirÃ ",
    "2802",
    "63"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-sanfonts/'>Pic de Sanfonts</a>",
    "Andorra, Pallars SobirÃ ",
    "2889",
    "78"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-entravessada/'>Roca Entravessada</a>",
    "Andorra, Pallars SobirÃ ",
    "2929",
    "54"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-clara/'>Puig ClarÃ </a>",
    "Pla de l'Estany",
    "315",
    "364"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/punta-dels-pins-carrassers/'>Punta dels Pins Carrassers</a>",
    "Priorat",
    "1062",
    "228"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lo-morral/'>lo Morral</a>",
    "Priorat",
    "682",
    "248"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/les-carcoles/'>les CÃ rcoles</a>",
    "Ribera d'Ebre",
    "425",
    "150"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-laguila/'>Pic de l'Ã€guila</a>",
    "Ribera d'Ebre",
    "492",
    "196"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/laliga/'>l'Ã€liga (Mola del Broi)</a>",
    "Ribera d'Ebre, Terra Alta",
    "383",
    "166"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-antoni/'>Sant Antoni</a>",
    "RipollÃ¨s",
    "1361",
    "307"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/gra-de-fajol/'>Gra de Fajol</a>",
    "RipollÃ¨s",
    "2714",
    "494"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-dorria/'>Puig de DÃ²rria</a>",
    "Cerdanya Nord, RipollÃ¨s",
    "2547",
    "303"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roca-colom/'>Roca Colom</a>",
    "Conflent, RipollÃ¨s, Vallespir",
    "2506",
    "423"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-del-mas-de-nadal/'>Tossal del Mas de Nadal</a>",
    "Segarra",
    "526",
    "282"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-gros-dalmatret/'>Tossal Gros d'Almatret</a>",
    "SegriÃ ",
    "346",
    "180"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-puigmari/'>TurÃ³ de PuigmarÃ­</a>",
    "Selva",
    "233",
    "385"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roques-del-rei/'>Roques del Rei</a>",
    "Selva",
    "852",
    "302"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-del-vent/'>TurÃ³ del Vent</a>",
    "Selva",
    "442",
    "399"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puigdefrou/'>Puigdefrou</a>",
    "Selva",
    "839",
    "267"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mola-de-lord/'>Mola de Lord</a>",
    "SolsonÃ¨s",
    "1189",
    "330"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-guardia-serra-de-busa/'>la GuÃ rdia (Serra de Busa)</a>",
    "SolsonÃ¨s",
    "1448",
    "321"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-de-les-monges-serrat-de-la-questio/'>Roc de les Monges (Serrat de la QÃ¼estiÃ³)</a>",
    "SolsonÃ¨s",
    "1415",
    "213"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/roc-del-migdia-la-valldan/'>Roc del Migdia (la Valldan)</a>",
    "SolsonÃ¨s",
    "1153",
    "197"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-simplici/'>Sant Simplici</a>",
    "TarragonÃ¨s",
    "110",
    "387"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/mola-dirto/'>Mola d'Irto</a>",
    "Terra Alta",
    "538",
    "202"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-miranda-de-terranyes/'>la Miranda de Terranyes</a>",
    "Terra Alta",
    "1193",
    "116"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/rocamala/'>Rocamala</a>",
    "Terra Alta",
    "621",
    "105"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/lo-blau-roca-grossa-moletans/'>lo Blau (Roca Grossa Moletans)</a>",
    "Terra Alta",
    "841",
    "106"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tossal-despigol/'>Tossal d'EspÃ­gol</a>",
    "Urgell",
    "368",
    "361"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-la-tallada/'>Tuc de la Tallada</a>",
    "Val d'Aran",
    "2956",
    "11"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-salana/'>Tuc de Salana</a>",
    "Val d'Aran",
    "2485",
    "112"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pujoalbo/'>Pujoalbo</a>",
    "Val d'Aran",
    "2504",
    "45"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/malh-dera-artiga/'>Malh dera Artiga</a>",
    "Val d'Aran",
    "2710",
    "15"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-parros/'>Tuc de Parros</a>",
    "Val d'Aran",
    "2731",
    "39"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/malh-de-bolard/'>Malh de Bolard</a>",
    "Val d'Aran",
    "2753",
    "29"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-crabera/'>Tuc de CrabÃ¨ra</a>",
    "Val d'Aran",
    "2630",
    "30"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/montanha-duishera/'>Montanha d'UishÃ¨ra</a>",
    "Val d'Aran",
    "2339",
    "87"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-darres/'>Tuc d'Arres</a>",
    "Val d'Aran",
    "2163",
    "125"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-des-armeros/'>Tuc des ArmÃ¨ros</a>",
    "Val d'Aran",
    "2534",
    "73"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/tuc-de-sarrahera/'>Tuc de SarrahÃ¨ra</a>",
    "Val d'Aran",
    "2634",
    "63"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/castell-de-bocs/'>Castell de Bocs</a>",
    "VallÃ¨s Occidental",
    "662",
    "330"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-montcada/'>TurÃ³ de Montcada</a>",
    "VallÃ¨s Occidental",
    "273",
    "404"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/turo-de-lhome/'>TurÃ³ de l'Home</a>",
    "VallÃ¨s Oriental",
    "1706",
    "721"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-sui/'>el Sui</a>",
    "VallÃ¨s Oriental",
    "1319",
    "495"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/alt-de-la-capa/'>Alt de la Capa</a>",
    "Andorra",
    "2573",
    "150"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-del-pla-de-lestany/'>Pic del Pla de l'Estany</a>",
    "Andorra",
    "2860",
    "40"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-la-coma-de-varilles/'>Pic de la Coma de Varilles</a>",
    "Andorra",
    "2760",
    "94"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-alt-del-cubil/'>Pic Alt del Cubil</a>",
    "Andorra",
    "2834",
    "95"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-cabanyo/'>Pic de CabanyÃ³</a>",
    "Andorra",
    "2732",
    "94"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-dels-pessons-o-gargantillar/'>Pic dels Pessons o Gargantillar</a>",
    "Andorra",
    "2862",
    "217"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/el-punxo/'>el PunxÃ³</a>",
    "Cerdanya Nord",
    "2581",
    "101"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-cometa/'>Puig de la Cometa</a>",
    "Cerdanya Nord",
    "2763",
    "71"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-font-viva/'>Puig de Font Viva</a>",
    "Cerdanya Nord",
    "2673",
    "101"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-occidental-de-coll-roig/'>Puig Occidental de Coll Roig</a>",
    "Cerdanya Nord",
    "2833",
    "39"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-dels-pedrons/'>Pic dels Pedrons</a>",
    "Cerdanya Nord",
    "2715",
    "106"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-del-pam/'>Puig del Pam</a>",
    "Capcir",
    "2470",
    "125"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torre-de-goa/'>Torre de GoÃ </a>",
    "Conflent",
    "1267",
    "87"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-coma-mitjana/'>Pic de Coma Mitjana</a>",
    "Conflent",
    "2732",
    "65"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-pelada/'>Puig de la Pelada</a>",
    "Conflent",
    "2370",
    "88"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/santa-anna-dels-quatre-termes/'>Santa Anna dels Quatre Termes</a>",
    "Conflent, RossellÃ³",
    "1348",
    "76"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pic-de-gallinassa/'>Pic de Gallinassa</a>",
    "Conflent, Vallespir",
    "2461",
    "101"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/puig-de-la-collada-verda/'>Puig de la Collada Verda</a>",
    "Conflent, Vallespir",
    "2403",
    "90"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-serra-vingrau/'>la Serra (Vingrau)</a>",
    "RossellÃ³",
    "576",
    "116"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/sant-marti-de-la-roca/'>Sant MartÃ­ de la Roca</a>",
    "RossellÃ³",
    "522",
    "176"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/torre-de-la-macana/'>Torre de la MaÃ§ana</a>",
    "RossellÃ³",
    "794",
    "134"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/pilo-de-bellmaig/'>PilÃ³ de Bellmaig</a>",
    "Vallespir",
    "1281",
    "98"
  ],
  [
    "<a href='https://www.feec.cat/activitats/100-cims/cim/la-soca/'>la Soca</a>",
    "Vallespir",
    "1635",
    "77"
  ]
]

# Extract URLs using BeautifulSoup
urls = []
for item in data:
    html = item[0]  # First element contains the anchor tag
    soup = BeautifulSoup(html, 'html.parser')
    link = soup.a['href'] if soup.a else None
    if link:
        urls.append(link)

# Save the extracted URLs to a JSON file
output_file = "data/urls.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(urls, f, indent=4)

print(f"Extracted URLs saved to {output_file}")