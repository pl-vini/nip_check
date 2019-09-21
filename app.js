const config = require('./config.json');
const Pl = require('./providers/pl');
const Eu = require('./providers/eu');
const tools = require('./tools');
const fs = require('fs');
const readline = require('readline');
const dateTime = require('date-time');
const sort = require('./sort');
const Twig = require('twig'); // Twig module
const twig = Twig.twig;       // Render function
const dateFormat = require('dateformat');

let vatPromises = [];
let timeOut = 0;
let reqPerSec = 1000 / config.reqPerSec;
let wrongNIP = [];
let vatResults = [];
let lineCounter = 0;

let file = process.argv[2];
let ext = tools.getFileType(file);
if (config.supportedFileTypes.indexOf(ext) < 0) {
  console.log('Brak podanego pliku do analizy lub ten plik nie jest obsługiwany');
  process.exit();
};

console.log(`Start: ${dateTime({showMilliseconds: true})}`);

const rl = readline.createInterface({
  input: fs.createReadStream(file),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
if (config.startLine > ++lineCounter) { return; }

let data = line.split('|');
let nip1 = (data[9]) ?data[9].trim() : '';
let nip2 = (data[10]) ? data[10].trim() : '';
let col11 = (data[11]) ? data[11].trim() : '';
let companyData = '';
if (nip1 || nip2) {
  companyData = {
    'name': data[4],
    'street': data[5],
    'postCode': data[6],
    'city': data[7],
    'sapId': data[3],
    'col11': col11,
  }
}

  if (nip1) {
    oneLineAction(nip1, wrongNIP, vatResults, companyData);
  }
  if (nip2) {
    oneLineAction(nip2, wrongNIP, vatResults, companyData);
  }
  return;
});

function oneLineAction(line, wrongNIP, vatResults, companyData) {
  try {
    vatPromises = [...vatPromises, prom(line, timeOut, wrongNIP, vatResults, companyData)];
    timeOut += reqPerSec;
  } catch (err) {
    if (err.message) {
      wrongNIP.push(err.message);
      console.log(err.message);
    }
  }
}

 rl.on('close', (line) => {
    Promise.all(vatPromises)
    .then((results) => {
    }).catch(err => {
        wrongNIP.push(err);
        console.log("Error Promise:"+err);
    }).finally(res => {
      let data = sort.unification(vatResults);
      data = sort.sort(data);
      // console.log(`final: ${data}`);
      console.log(`Koniec: ${dateTime({showMilliseconds: true})}`);
      // console.log(data);
  
      let options = {
        "data": data, 
        "datetime": dateTime({showMilliseconds: false}),
        "errors": wrongNIP,
      };
      let fileName = `Raport_${dateFormat(dateTime(), "yyyy_mm_dd__HH_MM_ss")}.html`;
  
      Twig.renderFile('./template/index.twig', options, (err, html) => {
        fs.writeFile(fileName, html, function(err) {
          if(err) {
              return console.log(err);
          }
      
          console.log("Raport zapisany");
        }); 
      });
    });
  });

function prom(line, timeOut, wrongNIP, vatResults, companyData) {
  let vat;
  let vatNumber = tools.clean(line);
  if (vatNumber == '') {
    throw new Error();
  }
  if (tools.checkVatNumberCountry(vatNumber) == 'PL') {
    vat = new Pl();
    if (!tools.checkPlVatOK(vatNumber)) {
      // throw new Error(`Błędny numer NIP:${vatNumber} [${line}]`);
      wrongNIP.push(`Błędny numer NIP:${vatNumber} [${line}]`);
    }
  } else {
    vat = new Eu();
  }

  return new Promise(resolve => setTimeout(resolve, timeOut))
  .then(() => {
    console.log(vatNumber + ' ' + dateTime({showMilliseconds: true}));
    return vat.checkVat(vatNumber, vatResults, companyData);
  })
  .catch(err => {
    console.log('inside prom Error:' + err.message);
    wrongNIP.push(err);
  });
}


