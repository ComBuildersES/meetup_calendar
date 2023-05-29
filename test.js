const {HttpsProxyAgent} = require('https-proxy-agent');
const {JSDOM} = require('jsdom');
const URL = 'https://www.meetup.com/cps-spain/events/';
const COMMUNITY = URL.split('/')[3];

(async () => {
    const proxyAgent = new HttpsProxyAgent('http://localhost:3128');
    const response = await fetch(URL, { agent: proxyAgent});
    const html = await response.text();
    const dom = new JSDOM(html);
    
    let list = [...dom.window.document.querySelectorAll('.eventCard--link, time')]
        .reduce((o,c,i,arr) => { 
            if (i % 2 == 1) { 
                let eventTime = parseInt(arr[i].dateTime);
                let eventUrl = arr[i-1].href;
                if (Date.now() < eventTime && eventUrl.includes(COMMUNITY)) {
                    o.push([eventUrl,eventTime])
                }
            } 
            return o; 
        }, [])
    return list;
})();
