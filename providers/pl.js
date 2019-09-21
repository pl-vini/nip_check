const soapRequest = require('easy-soap-request');
const xpath = require('xml2js-xpath');
const parseString = require('xml2js').parseString;

class Pl {

    constructor() {
        this.url = 'https://sprawdz-status-vat.mf.gov.pl';
        this.headers = {
            'Content-Type': 'text/xml;charset=UTF-8',
            'soapAction': 'http://www.mf.gov.pl/uslugiBiznesowe/uslugiDomenowe/AP/WeryfikacjaVAT/2018/03/01/WeryfikacjaVAT/SprawdzNIP',
        };
        this.template = `<soapenv:Envelope 
        xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
        xmlns:ns="http://www.mf.gov.pl/uslugiBiznesowe/uslugiDomenowe/AP/WeryfikacjaVAT/2018/03/01">
        <soapenv:Header/>
            <soapenv:Body>
                <ns:NIP>#NIP#</ns:NIP>
            </soapenv:Body>
        </soapenv:Envelope>`;
    }

    async checkVat(nip, vatResults, companyData) {
        let xml = this.template.replace('#NIP#', nip);
        let message;
        let code;
        let body;
        let statusCode;
        try {
            await soapRequest(this.url, this.headers, xml, 10000)
            .then(function(ret) {
                body = ret.response.body;
                statusCode = ret.response.statusCode;
              })
              .catch(function(rej) {
                throw Error(`[SOAP] NIP ${nip}`) //${rej}
              });
            
        } catch (err) {
            throw Error(`NIP ${nip} ${err.message}`)
        }
        if (statusCode != 200) {
            throw Error(`Connection error: ${statusCode}`);
        }
        parseString(body, (err, json) => {
            message = xpath.find(json, "//Komunikat");
            code = xpath.find(json, "//Kod");
        });

        let ret = {
            'vatNumber': nip,
            'message': message,
            'code': code,
            'provider': 'PL',
            'companyData': companyData,
        };

        vatResults.push(ret);
    }
}

module.exports =  Pl;
