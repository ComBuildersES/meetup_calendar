const {HttpsProxyAgent} = require('https-proxy-agent');
const {JSDOM} = require('jsdom');
const proxyAgent = new HttpsProxyAgent('http://localhost:3128');
const ical = require('ical-generator').default;

const calendar = ical({name: "Comunidades Tecnológicas Madrid"});
const COMMUNITIES_URL = 'https://raw.githubusercontent.com/Comunidades-Tecnologicas/comunidades-tecnologicas.github.io/master/data/communities.json';

function addItemsToCalendar(events) {
  let list = events
     .map(({o}) => createEvent(o));
  return calendar.toString();
}

function createEvent(obj) {
  let community = obj.url.split("/")[3];
  let startTime = new Date(obj.startDate);
  let endTime = new Date(obj.endDate);
  calendar.createEvent({
    start : startTime,
    end: endTime,
    url : obj.url,
    summary: `${community} - ${obj.name}`,
    description: `${obj.url} \n\n${obj.description}`,
    location: obj.location?.name ?? "Madrid" 
  });
}

const EXTRACTIONS = {
  url : {
    selector : '.eventCard--link, time',
    fn : (a) => {
        return a
          .reduce((o,c,i,arr) => { 
            if (i % 2 == 1) { 
                let eventTime = parseInt(arr[i].dateTime);
                let eventUrl = arr[i-1].href;

                if (Date.now() < eventTime) {
                    o.push(`https://www.meetup.com${eventUrl}`)
                }
            } 
            return o; 
          }, [])          
    }
  },
  detail : {
    selector : 'script[type="application/ld+json"]',
    fn : (a) => {
      return a
        .map(s => JSON.parse(s.textContent))
        .filter(o => /(Event|RsvpAction)/.test(o["@type"]))
        .reduce((o,c,i,arr) => { 
            let etype = c["@type"];
            delete c["@type"];
            delete c["@context"]; 
            o = {o,...c};
            return o; 
        }, {})      
    }
  }
};

function extract (html, extractType) {
  const dom = new JSDOM(html);      
  let results = [...dom.window.document.querySelectorAll(EXTRACTIONS[extractType].selector)];
  let list = EXTRACTIONS[extractType].fn(results)
  return list; 
}

// Return an array of url events for that community
async function search (url, cat) {
  return fetch(url,{ agent: proxyAgent})
    .then(res => res.text())
    .then(txt => extract(txt, cat))
    .catch(err => console.error(err));
}

(async (url) => {
    const MEETUP_LIST = await fetch(url,{ agent: proxyAgent})
      .then(res => res.json())
      .then(json => json.communities.map(c => `${c.web.replace("http","https","gi")}events/`));

    let eventsArr = MEETUP_LIST.map(community => {
      return search(community,"url");
    });

    let events_urls = await Promise.allSettled(eventsArr)
      .then(res => {
        return res
          .filter(res => res.status === "fulfilled")
          .map(res => res.value); 
      });
    
    let events_details = events_urls
      .flat()
      .map(ev => {
        return search(ev, "detail")
      });

    let results = await Promise.allSettled(events_details)
      .then(res => {
        return res
          .filter(res => res.status === "fulfilled")
          .map(res => res.value)
      })         
      .then(list => addItemsToCalendar(list))
      .catch(err => console.error(err));
     
      
    


    console.log(results)

})(COMMUNITIES_URL);