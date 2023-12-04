import * as utils from '../src/utils.js';
import { BANNER, NATIVE, VIDEO } from '../src/mediaTypes.js';
import { registerBidder } from '../src/adapters/bidderFactory.js';

const BIDDER_CODES = {
  RTB_2_4: 'exadsadserver_rtb_2_4',
  RTB_2_5: 'exadsadserver_rtb_2_5',
};

const envParams = {
  lang: "",
  user_agent: "",
  os_name: "",
  page: "",
  domain: "",
  debug: true
};

const adPartnerHandlers = {
  [BIDDER_CODES.RTB_2_4]: {
    request: handleReqRTB_2_4,
    response: handleResRTB_2_4
  }
}; 

function handleReqRTB_2_4(bid, endpointUrl, validBidRequests, bidderRequest) {
  console.log(`Calling endpoint for rtb_2_4:`, endpointUrl);
  
  // Make a dynamic bid request to the ad partner's endpoint
  let bidRequestData = {
      'id': bid.bidId, // NOT bid.bidderRequestId or bid.auctionId
      'at': 1,
      'imp': [],
      'site': {
        'id': bid.params.siteId,
        'domain': envParams.domain,
        'cat': bid.params.catIab,
        'page': envParams.page,
        'keywords': 'lifestyle, humour'
      },
      'device': {
        'ua': envParams.user_agent,
        'ip': bid.params.userIp,
        'geo': {
          'country': 'IRL'
        },
        'language': envParams.lang,
        'os': envParams.os_name,
        'js': 0,
        'ext': {
          'remote_addr': '',
          'x_forwarded_for': '',
          'accept_language': 'en-GB'
        }
      },
      'user': {
        'id': ''
      },
      'ext': {
        'sub': 0
      }
    };

    // Banner setup
    const bannerMediaType = utils.deepAccess(bid, 'mediaTypes.banner');
    if(bannerMediaType != null) {
      bidRequestData.imp = bannerMediaType.sizes.map(size => ({
          'id': bid.params.impressionId,
          'bidfloor': 0.00000011,
          'bidfloorcur': 'EUR',
          'banner': {
            'w': size[0],
            'h': size[1]
          }
        })
      );
    }
    const nativeMediaType = utils.deepAccess(bid, 'mediaTypes.native');

    if(nativeMediaType != null) {
      const native = {
        "native": {
          "ver": "1.2",
          "context": 1,
          "contextsubtype": 10,
          "plcmttype": 4,
          "plcmtcnt": 4
        }
      };

      native.native.assets = bidRequestData.imp = nativeMediaType.ortb.assets.map(asset => {
        const newAsset = asset;
        if(newAsset.img != null) {
          newAsset.img.wmin = newAsset.img.h;
          newAsset.img.hmin = newAsset.img.w;
        }
        return newAsset;
      });

      const imp = [{
        'id': bid.params.impressionId,
        'bidfloor': 0.00000011,
        'bidfloorcur': 'EUR',
        'native': {
          'request': JSON.stringify(native),
          "ver": "1.2"
          },
        }];
      
      bidRequestData.imp = imp;
    
    };

    const videoMediaType = utils.deepAccess(bid, 'mediaTypes.video');

    if(videoMediaType != null) {

      const imp = [{
          'id': bid.params.impressionId,
          'video': {
              "mimes": ["video/mp4"]
            },
          "protocols": [
              3,
              6
            ],
          "ext": {
              "video_cta": 0
          }
        }]; 

        bidRequestData.imp = imp;

    }

    if (envParams.debug) {
      console.log('PAYLOAD:');
      console.log(bidRequestData);
      console.log(JSON.stringify(bidRequestData));
      console.log('FINAL URL:');
      console.log(endpointUrl);
      console.log('---------------------------------------');
    }

    //const data = converter.toORTB({validBidRequests, bidderRequest});

    // Use an appropriate method (e.g., AJAX, fetch) to make the bid request
    return makeBidRequest(endpointUrl, bidRequestData);
  };

function handleResRTB_2_4(serverResponse, request) {
  if (envParams.debug) {
    console.log('interpretResponse -> serverResponse:');
    console.log(serverResponse);
    console.log('interpretResponse -> request:');
    console.log(request);
    console.log('interpretResponse -> request json data:');
    console.log(JSON.parse(request.data));
    console.log('---------------------------------------');
  }

  let bidResponses = [];

  if (serverResponse.hasOwnProperty('body') && serverResponse.body.hasOwnProperty('id')) {
    if (envParams.debug) {
      console.log('ENTRO server response');
      console.log(serverResponse.body.id);
      console.log('-----------------------------');
      console.log(serverResponse.body.seatbid[0].bid[0]);
    }

    const bidRq = JSON.parse(request.data);
    const requestId = serverResponse.body.id;
    const bidData = serverResponse.body.seatbid[0].bid[0];
    let bidResponseAd = bidData.adm;
    let pixelUrl = bidData.nurl.replace(/^http:\/\//i, 'https://');
    let pixelImage = '<img width="1" height="1" border="0" src="' + pixelUrl + '" />';
   

    const bannerInfo = utils.deepAccess(bidRq.imp[0], 'banner');
    const nativeInfo = utils.deepAccess(bidRq.imp[0], 'native');
    const videoInfo = utils.deepAccess(bidRq.imp[0], 'video');

    let w, h = 0;
    let mediaType = '';
    const native = {};

    if(bannerInfo != null) {
      bidResponseAd = bidResponseAd + pixelImage;
      w = bidRq.imp[0].banner.w;
      h = bidRq.imp[0].banner.h;
      mediaType = BANNER;
    } else if(nativeInfo != null) {
      const reqNative = JSON.parse(bidResponseAd);
      reqNative.native.assets.forEach(asset => {
        if(asset.img != null) {
          const imgAsset = JSON.parse(bidRq.imp[0].native.request)
            .native.assets.filter(asset => asset.img != null).map(asset=>asset.img);
          w = imgAsset[0].w;
          h = imgAsset[0].h;
          native.image = {
            url: asset.img.url,
            height: h,
            width: w
          }
        } else if (asset.title != null) {
          native.title = asset.title.text;
        } else if (asset.data != null) {
          native.body = asset.data.value;
        }
      });
      mediaType = NATIVE;

    } else if(videoInfo != null) {
      mediaType = VIDEO;
    }

    const bidResponse = {
      requestId: requestId,
      currency: 'USD',
      ad: bidResponseAd,
      cpm: 1.50,
      creativeId: bidData.crid,
      cid: bidData.cid,
      width: w,
      ttl: 360,
      height: h,
      netRevenue: true,
      mediaType: mediaType,
    };

    if(mediaType == 'native') {
      native.clickUrl = pixelUrl;
      bidResponse.native = native;
    }

    if(mediaType == 'video') {
      bidResponse.vastUrl = pixelUrl;
      bidResponse.width = bidData.w;
      bidResponse.height = bidData.h;
    }

    if (envParams.debug) {
      console.log('------> bidResponse :');
      console.log(bidResponse);
    }

    bidResponses.push(bidResponse);
  } else if (envParams.debug) {
    console.log('NO ENTRO server response');
    console.log(serverResponse.body.id);
  }

  if (envParams.debug) {
    console.log('interpretResponse -> bidResponses:');
    console.log(bidResponses);
  }

  //return bidResponses;
  return bidResponses;
}

function makeBidRequest(url, data) {
  const payloadString = JSON.stringify(data);

  return {
    method: 'POST',
    url: url,
    data: payloadString,
  }
}

function getUrl(adPartner, bid) {
  let endpointUrlMapping = {
    [BIDDER_CODES.RTB_2_4]: bid.params.endpoint + '?idzone=' + bid.params.zoneId + '&fid=' + bid.params.fid
    // Add more mappings as needed
  };

  return endpointUrlMapping[adPartner] ? endpointUrlMapping[adPartner] : 'defaultEndpoint';
}

function manageEnvParams() {
  envParams.debug = true;
  envParams.domain = window.location.hostname;
  envParams.page = window.location.protocol + '//' + window.location.host + window.location.pathname;
  envParams.lang = navigator.language;
  if (envParams.lang.indexOf('-') > -1) {
    envParams.lang = envParams.lang.split('-')[0];
  }
  envParams.user_agent = navigator.userAgent;
  if (navigator.appVersion.indexOf('Win') !== -1) {
    envParams.os_name = 'Windows';
  }
  if (navigator.appVersion.indexOf('Mac') !== -1) {
    envParams.os_name = 'MacOS';
  }
  if (navigator.appVersion.indexOf('X11') !== -1) {
    envParams.os_name = 'Unix';
  }
  if (navigator.appVersion.indexOf('Linux') !== -1) {
    envParams.os_name = 'Linux';
  }

  if (envParams.debug) {
    console.log('Domain: ' + envParams.domain);
    console.log('Page12: ' + envParams.page);
    console.log('Lang: ' + envParams.lang);
    console.log('OS: ' + envParams.os_name);
    console.log('User Agent: ' + envParams.user_agent);
  }
}

const imps = new Map();;

manageEnvParams();

export const spec = {
  aliases: ['exads'], // short code
  supportedMediaTypes: [BANNER, NATIVE, VIDEO],
  isBidRequestValid: function (bid) {
    if (envParams.debug) {
      console.log('isBidRequestValid -> bid:');
      console.log(bid);
      console.log('---------------------------------------');
    }

    return !!(bid.params.userIp && bid.params.zoneId && bid.params.fid);
  },
  buildRequests: function (validBidRequests, bidderRequest) {
    if (envParams.debug) {
      console.log('validBidRequests -> validBidRequests:');
      console.log(validBidRequests);
      console.log('validBidRequests -> bidderRequest:');
      console.log(bidderRequest);
      console.log('---------------------------------------');
    }

    // pull requested transaction ID from bidderRequest.bids[].transactionId
    return validBidRequests.map(bid => {
      let adPartner = bid.bidder;

      imps.set(bid.params.impressionId, adPartner);

      let endpointUrl = getUrl(adPartner, bid);

      // Call the handler for the ad partner, passing relevant parameters
      if (adPartnerHandlers[adPartner]['request']) {
        return  adPartnerHandlers[adPartner]['request'](bid, endpointUrl, validBidRequests, bidderRequest);
      } else {
        // Handle unknown or unsupported ad partners
        return null;
      }
    });
  },
  interpretResponse: function (serverResponse, request) {
    const bid = JSON.parse(request.data);
    let adPartner = imps.get(bid.imp[0].id);
    imps.delete(bid.imp[0].id);

    // Call the handler for the ad partner, passing relevant parameters
    if (adPartnerHandlers[adPartner]['response']) {
      return  adPartnerHandlers[adPartner]['response'](serverResponse, request);
    } else {
      // Handle unknown or unsupported ad partners
      return null;
    }
  },
  getUserSyncs: function (syncOptions, serverResponses, gdprConsent, uspConsent) {
    if (envParams.debug) {
      console.log('getUserSyncs -> syncOptions:');
      console.log(syncOptions);
      console.log('getUserSyncs -> serverResponses:');
      console.log(serverResponses);
      console.log('getUserSyncs -> gdprConsent:');
      console.log(gdprConsent);
      console.log('getUserSyncs -> uspConsent:');
      console.log(uspConsent);
      console.log('---------------------------------------');
    }
  },
  onTimeout: function (timeoutData) {
    if (envParams.debug) {
      console.log('onTimeout -> timeoutData:');
      console.log(timeoutData);
      console.log('---------------------------------------');
    }
  },
  onBidWon: function (bid) {
    if (envParams.debug) {
      console.log('onBidWon -> bid:');
      console.log(bid);
      console.log('---------------------------------------');
    }
  },
  onSetTargeting: function (bid) {
    if (envParams.debug) {
      console.log('onSetTargeting -> bid:');
      console.log(bid);
      console.log('---------------------------------------');
    }
  }
};

registerBidder({
  code: BIDDER_CODES.RTB_2_4,
  ...spec
});

registerBidder(
{
  code: BIDDER_CODES.RTB_2_5,
  ...spec
});
