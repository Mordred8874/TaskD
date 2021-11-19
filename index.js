const  AdmZip = require("adm-zip");
const  fs = require("fs");
const  path = require("path")
const  csv = require("csv-parser")//module for parse CSV file(use streams)

// take a path to a zip File
const pathToZipFile=process.argv[2] || 'Test data.zip';//take third value in command line or take default value from repository
const pathToFolderForZip=path.dirname(pathToZipFile);//take path dir where is target zip
console.log('Path to zip file with csv files', pathToZipFile);

//extracting zip file
const zip= new AdmZip(pathToZipFile)//init constructor for unzip archive
zip.extractAllTo(pathToFolderForZip)//unzip archive in folder where is zip file

// get list of csv files
const ListOfCsvFiles = fs.readdirSync(pathToFolderForZip).filter(fileName=>path.extname(fileName)===".csv")//take list of csv files from zip file
console.log('List of csv files:');
ListOfCsvFiles.forEach(fileName => console.log('\t',fileName))

const pathToResult=path.join(pathToFolderForZip, 'result.json');//create path to result JSON file
fs.writeFileSync(pathToResult, '[\n') //create JSON file with first symbol

let first = '';//init flag for first element of array

function pushDataToJSON(fileName) {//function for parse current CSV file
    return new Promise((res, req) => {//use promise due to correct work with streams(async functions)
        fs.createReadStream(fileName)//create read stream
            .pipe(csv({ separator: '||'}))//parse data to object type
            .on('data', data => {//work with data(each entry from CSV)
                let resultObj = {//create result object for JSON file
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
                resultObj=JSON.stringify(resultObj,null,4).split('\n').map(i=>'    '+i).join('\n')//formating result object with correct tabulating
                fs.appendFileSync(pathToResult, first+resultObj)//write result to JSON file
                if (!first)
                    first=',\n'
            })
            .on('end', () => {
                console.log('Parsing file ' + fileName + ' Done.');
                res();
            })
    })
}

async function main() {//create async function due to parsing work with streams
    for (const fileName of ListOfCsvFiles) {//init cycle for parse each CSV file
        await pushDataToJSON(fileName);//parse current CSV file
    }
    fs.appendFileSync(pathToResult, '\n]')//Added last symbol in JSON file
}

main()//function start up
