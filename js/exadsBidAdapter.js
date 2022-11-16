import * as utils           from '../src/utils';
import { BANNER }           from '../src/mediaTypes.js';
import { registerBidder }   from '../src/adapters/bidderFactory';
//import { config }           from '../src/config';

const BIDDER_CODE       = 'exadsadserver';

const exads_endpoint    = "https://rtb.adnflow.com/rtb.php";

// Setup
const debug             = true;

// Domain data
const domain            = window.location.hostname;

// Page data
const page              = window.location.protocol + "//" + window.location.host + window.location.pathname;

// Language data
let lang                = navigator.language;
if(lang.indexOf('-') > -1) lang = lang.split("-")[0];

// User Agent data
let user_agent          = navigator.userAgent;

// User OS data
let os_name             = "";
if(navigator.appVersion.indexOf("Win") !== -1) os_name = "Windows";
if(navigator.appVersion.indexOf("Mac") !== -1) os_name = "MacOS";
if(navigator.appVersion.indexOf("X11") !== -1) os_name = "Unix";
if(navigator.appVersion.indexOf("Linux") !== -1) os_name = "Linux";

if(debug){
  console.log("Domain: " + domain);
  console.log("Page: " + page);
  console.log("Lang: " + lang);
  console.log("OS: " + os_name);
  console.log("User Agent: " + user_agent);
}

export const spec       = {
  code                : BIDDER_CODE,
  aliases             : ['exads'], // short code
  supportedMediaTypes : [BANNER],
  isBidRequestValid   : function(bid){
    if(debug){
      console.log("isBidRequestValid -> bid:");
      console.log(bid);
      console.log("---------------------------------------");
    }

    //return !!(bid.params && bid.params.siteId && bid.params.pageId && bid.params.formatId);
    return !!(bid.params.userIp && bid.params.zoneId && bid.params.fid);
  },
  buildRequests       : function(validBidRequests, bidderRequest){
    if(debug){
      console.log("validBidRequests -> validBidRequests:");
      console.log(validBidRequests);
      console.log("validBidRequests -> bidderRequest:");
      console.log(bidderRequest);
      console.log("---------------------------------------");
    }

    // pull requested transaction ID from bidderRequest.bids[].transactionId
    return validBidRequests.map(bid => {
      // Payload setup
      let payload           = {
        "id"      : bid.bidId, // NOT bid.bidderRequestId or bid.auctionId
        "at"      : 1,
        "imp"     : [],
        "site"    : {
          "id"        : bid.params.siteId,
          "domain"    : domain,
          "cat"       : bid.params.catIab,
          "page"      : page,
          "keywords"  : ""
        },
        "device"  : {
          "ua"  : user_agent,
          "ip"  : bid.params.userIp,
          "language"  : lang,
          "os"        : os_name,
          "js"        : 1,
          "ext"       : {
            "remote_addr"     : "",
            "x_forwarded_for" : "",
            "accept_language" : ""
          }
        },
        "user"    : {
          "id" : ""
        },
        "ext"     : {
          "sub" : 0
        }
      };

      // Banner setup
      const videoMediaType  = utils.deepAccess(bid, 'mediaTypes.video');
      if(!videoMediaType){
        const bannerMediaType = utils.deepAccess(bid, 'mediaTypes.banner');
        payload.imp           = bannerMediaType.sizes.map(size => ({
            "id"      : bid.params.impressionId,
            "banner"  : {
              "w" : size[0],
              "h" : size[1]
            }
          })
        );
      }

      //const finalUrl        = exads_endpoint + "?idzone=" + validBidRequests[0].params.zoneId + "&fid="  + validBidRequests[0].params.fid + "&debug=1";
      const finalUrl        = exads_endpoint + "?idzone=" + validBidRequests[0].params.zoneId + "&fid="  + validBidRequests[0].params.fid;

      if(debug){
        console.log("PAYLOAD:");
        console.log(payload);
        console.log(JSON.stringify(payload));
        console.log("FINAL URL:");
        console.log(finalUrl);
        console.log("---------------------------------------");
      }

      /*const testPayload     = {
        "id": bid.bidId,
        "at":1,
        "imp":[
          {
            "id": "ssdfsdfsdfsfd",
            "banner":{
              "w":300,
              "h":250
            }
          }
        ],
        "site":{
          "id": "2028",
          "domain":"220news.com",
          "cat":[
            "IAB25-3"
          ],
          "page":"https://220news.com",
          "keywords":""
        },
        "device":{
          "ua":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
          "ip":"3.126.68.109",
          "geo":{
            "country":"ESP"
          },
          "language":"en",
          "os":"Windows",
          "js":1,
          "ext":{
            "remote_addr":"",
            "x_forwarded_for":"",
            "accept_language":""
          }
        },
        "user":{
          "id":""
        },
        "ext":{
          "sub":0
        }
      };*/

      const payloadString   = JSON.stringify(payload);
      //const payloadString   = JSON.stringify(testPayload);

      return{
        method  : 'POST',
        url     : finalUrl,
        data    : payloadString,
      }
    });
  },
  interpretResponse   : function(serverResponse, request){
    if(debug){
      console.log("interpretResponse -> serverResponse:");
      console.log(serverResponse);
      console.log("interpretResponse -> request:");
      console.log(request);
      console.log("interpretResponse -> request json data:");
      console.log(JSON.parse(request.data));
      console.log("---------------------------------------");
    }

    let bidResponses = [];

    if(serverResponse.hasOwnProperty('body') && serverResponse.body.hasOwnProperty('id')){
      if(debug){
        console.log("ENTRO server response");
        console.log(serverResponse.body.id);
        console.log("-----------------------------");
        console.log(serverResponse.body.seatbid[0].bid[0]);
      }

      const bidRq       = JSON.parse(request.data);
      const requestId   = serverResponse.body.id;
      const bidData     = serverResponse.body.seatbid[0].bid[0];
      let bidResponseAd = bidData.adm;
      let pixelUrl      = bidData.nurl.replace(/^http:\/\//i, 'https://');
      let pixelImage    = '<img width="1" height="1" border="0" src="' + pixelUrl + '" />';
      bidResponseAd     = bidResponseAd + pixelImage;

      const bidResponse = {
        requestId   : requestId,
        //cpm         : bidData.price,
        cpm         : 1.50,
        currency    : "USD",
        width       : bidRq.imp[0].banner.w,
        height      : bidRq.imp[0].banner.h,
        creativeId  : bidData.crid,
        //dealId      : DEAL_ID,
        netRevenue  : true,
        ttl         : 360,
        ad          : bidResponseAd,
        mediaType   : "banner",
        /*meta: {
          advertiserDomains: [ARRAY_OF_ADVERTISER_DOMAINS],
          advertiserId: ADVERTISER_ID,
          advertiserName: ADVERTISER_NAME,
          agencyId: AGENCY_ID,
          agencyName: AGENCY_NAME,
          brandId: BRAND_ID,
          brandName: BRAND_NAME,
          dchain: DEMAND_CHAIN_OBJECT,
          mediaType: MEDIA_TYPE,
          networkId: NETWORK_ID,
          networkName: NETWORK_NAME,
          primaryCatId: IAB_CATEGORY,
          secondaryCatIds: [ARRAY_OF_IAB_CATEGORIES]
        }*/
      };

      if(debug){
        console.log("------> bidResponse :");
        console.log(bidResponse);
      }

      bidResponses.push(bidResponse);
    }else if(debug){
        console.log("NO ENTRO server response");
        console.log(serverResponse.body.id);
    }

    if(debug){
      console.log("interpretResponse -> bidResponses:");
      console.log(bidResponses);
    }

    return bidResponses;
  },
  getUserSyncs        : function(syncOptions, serverResponses, gdprConsent, uspConsent){
    if(debug){
      console.log("getUserSyncs -> syncOptions:");
      console.log(syncOptions);
      console.log("getUserSyncs -> serverResponses:");
      console.log(serverResponses);
      console.log("getUserSyncs -> gdprConsent:");
      console.log(gdprConsent);
      console.log("getUserSyncs -> uspConsent:");
      console.log(uspConsent);
      console.log("---------------------------------------");
    }
  },
  onTimeout           : function(timeoutData){
    if(debug){
      console.log("onTimeout -> timeoutData:");
      console.log(timeoutData);
      console.log("---------------------------------------");
    }
  },
  onBidWon            : function(bid){
    if(debug){
      console.log("onBidWon -> bid:");
      console.log(bid);
      console.log("---------------------------------------");
    }
  },
  onSetTargeting      : function(bid){
    if(debug){
      console.log("onSetTargeting -> bid:");
      console.log(bid);
      console.log("---------------------------------------");
    }
  }
};
registerBidder(spec);
