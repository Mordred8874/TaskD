const  AdmZip = require("adm-zip");
const  fs = require("fs");
const  path = require("path")
const  csv = require("csv-parser")

// take a path to a zip File
const pathToZipFile=process.argv[2] || 'Test data.zip';
const pathToFolderForZip=path.dirname(pathToZipFile);
console.log('Path to zip file with csv files', pathToZipFile);

//extracting zip file
const zip= new AdmZip(pathToZipFile)
zip.extractAllTo(pathToFolderForZip)

// get list of csv files
const ListOfCsvFiles = fs.readdirSync(pathToFolderForZip).filter(fileName=>path.extname(fileName)===".csv")
console.log('List of csv files:');
ListOfCsvFiles.forEach(fileName => console.log('\t',fileName))

const pathToResult=path.join(pathToFolderForZip, 'result.json');
fs.writeFileSync(pathToResult, '[\n') 

let first = '';

function pushDataToJSON(fileName) {
    return new Promise((res, req) => {
        fs.createReadStream(fileName)
            .pipe(csv({ separator: '||'}))
            .on('data', data => {
                let resultObj = {
                    name:data['last_name'] + ' ' + data['first_name'],
                    phone:'+380'+data['phone'].replace(/\D/g, ''),
                    person:{
                        firstName:data['first_name'],
                        lastName:data['last_name']
                    },
                    amount:+data['amount'],
                    date:data['date'].match(/\d{1,}/g).reverse().map(el => el.length === 1 && el.length !== 4 ? '0' + el : el).join('-'),
                    costCenterNum:data['cc'].replace(/^\D{1,3}/g,'')
                }
                resultObj=JSON.stringify(resultObj,null,4).split('\n').map(i=>'    '+i).join('\n')
                fs.appendFileSync(pathToResult, first+resultObj)
                if (!first)
                    first=',\n'
            })
            .on('end', () => {
                console.log('Parsing file ' + fileName + ' Done.');
                res();
            })
    })
}

async function main() {
    for (const fileName of ListOfCsvFiles) {
        await pushDataToJSON(fileName);
    }
    fs.appendFileSync(pathToResult, '\n]')
}

main()
