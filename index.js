const {HttpsProxyAgent} = require('https-proxy-agent');
const {JSDOM} = require('jsdom');
const proxyAgent = new HttpsProxyAgent('http://localhost:3128');
const ical = require('ical-generator').default;

const calendar = ical({name: "Comunidades Tecnológicas Madrid"});


const COMMUNITIES_URL = 'https://raw.githubusercontent.com/Comunidades-Tecnologicas/comunidades-tecnologicas.github.io/master/data/communities.json';

function addItemsToCalendar(events) {
  let list = events
     .map(arr => {
       if (arr.length > 0) {
        arr.map(([url,time]) => createEvent(url,time));
       }
     });
  return calendar.toString();
}

function createEvent(url,epoch) {
  let community = url.split("/")[3];
  let startTime = new Date(epoch);
  let endTime = new Date(epoch);
  endTime.setHours(startTime.getHours()+1);
  calendar.createEvent({
    start : startTime,
    end: endTime,
    url : url,
    summary: `${community} - Evento`,
    description: url,
    location: "Madrid"
  });
}

function extractData(html) {
  const dom = new JSDOM(html);
          
  let results = [...dom.window.document.querySelectorAll('.eventCard--link, time')];
  let list = results
      .reduce((o,c,i,arr) => { 
          if (i % 2 == 1) { 
              let eventTime = parseInt(arr[i].dateTime);
              let eventUrl = arr[i-1].href;

              if (Date.now() < eventTime) {
                  o.push([`https://www.meetup.com${eventUrl}`,eventTime])
              }
          } 
          return o; 
      }, [])
  return list; 
}

async function search (url) {
  return fetch(url,{ agent: proxyAgent})
        .then(res => res.text())
        .catch(err => console.error(err));
}

(async (url) => {
    const MEETUP_LIST = await fetch(url,{ agent: proxyAgent})
        .then(res => res.json())
        .then(json => json.communities.map(c => `${c.web.replace("http","https","gi")}events/`));

    let promisesArr = MEETUP_LIST.map(community => {
      return search(community);
    });
    let results = await Promise.allSettled(promisesArr)
              .then(res => {
                return res
                  .filter(res => res.status === "fulfilled")
                  .map(res => res.value); 
              })
              .then(arr => {
                return arr.map(html => extractData(html)).filter(arr => arr.length > 0);
              })
              .then(list => addItemsToCalendar(list))
              .catch(err => console.error(err));

    console.log(results)

})(COMMUNITIES_URL);