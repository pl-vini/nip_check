let result;

function transformer(data) {
    let vatInformation = {};
    if (data.provider == 'PL') {
        switch (data.code[0]) {
            case 'N':
                vatInformation.status = 'NO';
                break;
            case 'C':
                vatInformation.status = 'YES';
                break;
            case 'Z':
                vatInformation.status = 'RELEASED';
                break;
            default:    
                vatInformation.status = 'ERROR';
        }
        vatInformation.status_text = data.message[0];
        vatInformation.status_org = data.code[0];
        vatInformation.number = data.vatNumber;
    }

    if (data.provider == 'EU') {
        switch (data.valid[0]) {
            case 'false':
                vatInformation.status = 'NO';
                break;
            case 'true':
                vatInformation.status = 'YES';
                break;
            default:    
                vatInformation.status = 'ERROR';
        }
        vatInformation.number = data.vatNumber;
        vatInformation.status_org = data.valid[0];
        vatInformation.country = data.countryCode[0];
        vatInformation.companyAddress = data.address[0];
        vatInformation.companyName = data.name[0];
        vatInformation.requestDate = data.requestDate[0];
    }

    vatInformation.provider = data.provider;
    vatInformation.companyData = data.companyData;

    return vatInformation;
}

const unification = (array) => {
    let convertedResultArray = [];

    array.forEach(element => {
        convertedResultArray.push(transformer(element));
    });

    return convertedResultArray;
}



const sort = (array) => {
    let sortedArray = {no: [], others: [], yes: []};

    array.forEach(element => {
        switch (element.status) {
            case 'YES':
                sortedArray.yes.push(element);
                break;
            case 'NO':
                sortedArray.no.push(element);
                break;
            default:    
                sortedArray.others.push(element);
        }
    });

    return sortedArray;
}

module.exports = {
    'unification': unification,
    'sort': sort
}