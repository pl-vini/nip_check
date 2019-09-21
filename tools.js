var path = require('path');

const clean = (vatNumber) => {
    return vatNumber.replace(/[^\w]/g, "");
};

const checkVatNumberCountry = (vatNumber) => {
    return (/^([a-zA-Z]{2})/.test(vatNumber)) ? 'EU' : 'PL';
};

const checkPlVatOK = (vatNumber) => {
    return (/^([\d]{10})$/.test(vatNumber)) ? true : false;
}

const explodeEuVatNumber = (vatNumber) => {
    return {
        'countryCode': vatNumber.substring(0, 2),
        'vatNumber': vatNumber.substring(2, vatNumber.lenght),
    };
}

const getFileType = (filename) => {
    if ((typeof filename) != 'string') {
        return null;
    } else {
        return (path.extname(filename)).toLowerCase();
    }
}

module.exports = {
    'clean': clean,
    'checkVatNumberCountry': checkVatNumberCountry,
    'explodeEuVatNumber': explodeEuVatNumber,
    'getFileType': getFileType,
    'checkPlVatOK': checkPlVatOK,
}