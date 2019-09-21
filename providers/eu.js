const soapRequest = require('easy-soap-request');
const xpath = require('xml2js-xpath');
const parseString = require('xml2js').parseString;
const tools = require('../tools');

class Eu {

    constructor() {
        this.url = 'http://ec.europa.eu/taxation_customs/vies/services/checkVatService';
        this.headers = {
            'Content-Type': 'text/xml;charset=UTF-8',
        };
        this.template = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:tns1="urn:ec.europa.eu:taxud:vies:services:checkVat:types"
        xmlns:impl="urn:ec.europa.eu:taxud:vies:services:checkVat">
        <soap:Header></soap:Header>
        <soap:Body>
          <tns1:checkVat xmlns:tns1="urn:ec.europa.eu:taxud:vies:services:checkVat:types"
           xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
           <tns1:countryCode>#countryCode#</tns1:countryCode>
           <tns1:vatNumber>#vatNumber#</tns1:vatNumber>
          </tns1:checkVat>
        </soap:Body>
      </soap:Envelope>`;
    }

    async checkVat(vat, vatResults, companyData) {
        let {countryCode, vatNumber} = tools.explodeEuVatNumber(vat);
        let body;
        let statusCode;
        let xml = this.template
            .replace('#vatNumber#', vatNumber)
            .replace('#countryCode#', countryCode)
            ;
        try {
        await soapRequest(this.url, this.headers, xml, 10000)
        .then(function(ret) {
            body = ret.response.body;
            statusCode = ret.response.statusCode;
          })
          .catch(function(rej) {
            throw Error(`[SOAP] NIP ${vatNumber} ${rej}`)
          });
        } catch (err) {
            throw Error(`NIP ${vatNumber} ${err}`)
        }
        if (statusCode != 200) {
            throw Error(`Connection error: ${statusCode}`);
        }

        let dataCountryCode;
        let dataRequestDate;
        let dataValid;
        let dataName;
        let dataAddress;
        parseString(body, (err, json) => {
            dataCountryCode = xpath.find(json, "//countryCode");
            dataRequestDate = xpath.find(json, "//requestDate");
            dataValid = xpath.find(json, "//valid");
            dataName = xpath.find(json, "//name");
            dataAddress = xpath.find(json, "//address");
        });

        let ret = {
            'vatNumber': vat,
            'countryCode': dataCountryCode,
            'requestDate': dataRequestDate,
            'valid': dataValid,
            'name': dataName,
            'address': dataAddress,
            'provider': 'EU',
            'companyData': companyData
        };

        vatResults.push(ret);
    }
}

module.exports =  Eu;
