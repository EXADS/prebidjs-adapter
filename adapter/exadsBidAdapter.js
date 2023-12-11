import * as utils from '../src/utils.js';
import { BANNER, NATIVE, VIDEO } from '../src/mediaTypes.js';
import { registerBidder } from '../src/adapters/bidderFactory.js';

const BIDDER_CODES = {
    RTB_2_4: 'exadsadserver_rtb_2_4'
};

const envParams = {
    lang: "",
    userAgent: "",
    osName: "",
    page: "",
    domain: ""
};

const adPartnerHandlers = {
    [BIDDER_CODES.RTB_2_4]: {
        request: handleReqRTB_2_4,
        response: handleResRTB_2_4
    }
};

function handleReqRTB_2_4(bid, endpointUrl, validBidRequests, bidderRequest) {
    utils.logInfo(`Calling endpoint for rtb_2_4:`, endpointUrl);

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
            'keywords': bid.params.keywords
        },
        'device': {
            'ua': envParams.userAgent,
            'ip': bid.params.userIp,
            'geo': {
                'country': bid.params.country
            },
            'language': envParams.lang,
            'os': envParams.osName,
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
    if (bannerMediaType != null) {
        bidRequestData.imp = bannerMediaType.sizes.map(size => ({
            'id': bid.params.impressionId,
            'bidfloor': bid.params.bidfloor,
            'bidfloorcur': bid.params.bidfloorcur,
            'banner': {
                'w': size[0],
                'h': size[1]
            }
        })
        );
    }
    const nativeMediaType = utils.deepAccess(bid, 'mediaTypes.native');

    if (nativeMediaType != null) {
        const native = {
            "native": {
                "ver": bid.params.native.ver,
                "context": bid.params.native.context,
                "contextsubtype": bid.params.native.contextsubtype,
                "plcmttype": bid.params.native.plcmttype,
                "plcmtcnt": bid.params.native.plcmtcnt
            }
        };

        native.native.assets = bidRequestData.imp = nativeMediaType.ortb.assets.map(asset => {
            const newAsset = asset;
            if (newAsset.img != null) {
                newAsset.img.wmin = newAsset.img.h;
                newAsset.img.hmin = newAsset.img.w;
            }
            return newAsset;
        });

        const imp = [{
            'id': bid.params.impressionId,
            'bidfloor': bid.params.bidfloor,
            'bidfloorcur': bid.params.bidfloorcur,
            'native': {
                'request': JSON.stringify(native),
                "ver": bid.params.native.ver
            },
        }];

        bidRequestData.imp = imp;

    };

    const videoMediaType = utils.deepAccess(bid, 'mediaTypes.video');

    if (videoMediaType != null) {

        const imp = [{
            'id': bid.params.impressionId,
            'video': {
                "mimes": bid.params.stream.video.mimes
            },
            "protocols": bid.params.stream.protocols,
            "ext": bid.params.stream.ext
        }];

        bidRequestData.imp = imp;

    }

    utils.logInfo('PAYLOAD', bidRequestData, JSON.stringify(bidRequestData));
    utils.logInfo('FINAL URL', endpointUrl);

    return makeBidRequest(endpointUrl, bidRequestData);
};

function handleResRTB_2_4(serverResponse, request) {
    utils.logInfo('on handleResRTB_2_4 -> request:', request);
    utils.logInfo('on handleResRTB_2_4 -> request json data:', JSON.parse(request.data));
    utils.logInfo('on handleResRTB_2_4 -> serverResponse:', serverResponse);

    let bidResponses = [];

    if (serverResponse.hasOwnProperty('body') && serverResponse.body.hasOwnProperty('id')) {
        utils.logInfo('ENTRO server response', serverResponse.body.id);
        utils.logInfo('serverResponse.body.seatbid[0].bid[0]', serverResponse.body.seatbid[0].bid[0]);

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

        if (bannerInfo != null) {
            bidResponseAd = bidResponseAd + pixelImage;
            w = bidRq.imp[0].banner.w;
            h = bidRq.imp[0].banner.h;
            mediaType = BANNER;
        } else if (nativeInfo != null) {
            const reqNative = JSON.parse(bidResponseAd);
            reqNative.native.assets.forEach(asset => {
                if (asset.img != null) {
                    const imgAsset = JSON.parse(bidRq.imp[0].native.request)
                        .native.assets.filter(asset => asset.img != null).map(asset => asset.img);
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

        } else if (videoInfo != null) {
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

        if (mediaType == 'native') {
            native.clickUrl = pixelUrl;
            bidResponse.native = native;
        }

        if (mediaType == 'video') {
            bidResponse.vastUrl = pixelUrl;
            bidResponse.width = bidData.w;
            bidResponse.height = bidData.h;
        }

        utils.logInfo('bidResponse->', bidResponse);

        bidResponses.push(bidResponse);
    } else {
        utils.logInfo('NO ENTRO server response ->', serverResponse.body.id);
    }

    utils.logInfo('interpretResponse -> bidResponses:', bidResponses);

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
    envParams.domain = window.location.hostname;
    envParams.page = window.location.protocol + '//' + window.location.host + window.location.pathname;
    envParams.lang = navigator.language;
    if (envParams.lang.indexOf('-') > -1) {
        envParams.lang = envParams.lang.split('-')[0];
    }
    envParams.userAgent = navigator.userAgent;
    if (navigator.appVersion.indexOf('Win') !== -1) {
        envParams.osName = 'Windows';
    }
    if (navigator.appVersion.indexOf('Mac') !== -1) {
        envParams.osName = 'MacOS';
    }
    if (navigator.appVersion.indexOf('X11') !== -1) {
        envParams.osName = 'Unix';
    }
    if (navigator.appVersion.indexOf('Linux') !== -1) {
        envParams.osName = 'Linux';
    }

    utils.logInfo('Domain -> ', envParams.domain);
    utils.logInfo('Page -> ', envParams.page);
    utils.logInfo('Lang -> ', envParams.lang);
    utils.logInfo('OS -> ', envParams.osName);
    utils.logInfo('User Agent -> ', envParams.userAgent);
}

const imps = new Map();;

manageEnvParams();

export const spec = {
    aliases: ['exads'], // short code
    supportedMediaTypes: [BANNER, NATIVE, VIDEO],
    isBidRequestValid: function (bid) {
        utils.logInfo('on isBidRequestValid -> bid:', bid);
        return !!(bid.params.userIp && bid.params.zoneId && bid.params.fid);
    },
    buildRequests: function (validBidRequests, bidderRequest) {
        utils.logInfo('on buildRequests -> validBidRequests:', validBidRequests);
        utils.logInfo('on buildRequests -> bidderRequest:', bidderRequest);

        return validBidRequests.map(bid => {
            let adPartner = bid.bidder;

            imps.set(bid.params.impressionId, adPartner);

            let endpointUrl = getUrl(adPartner, bid);

            // Call the handler for the ad partner, passing relevant parameters
            if (adPartnerHandlers[adPartner]['request']) {
                return adPartnerHandlers[adPartner]['request'](bid, endpointUrl, validBidRequests, bidderRequest);
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
            return adPartnerHandlers[adPartner]['response'](serverResponse, request);
        } else {
            // Handle unknown or unsupported ad partners
            return null;
        }
    },
    getUserSyncs: function (syncOptions, serverResponses, gdprConsent, uspConsent) {
        utils.logInfo(`on getUserSyncs -> syncOptions:`, syncOptions);
        utils.logInfo(`on getUserSyncs -> serverResponses:`, serverResponses);
        utils.logInfo(`on getUserSyncs -> gdprConsent:`, gdprConsent);
        utils.logInfo(`on getUserSyncs -> uspConsent:`, uspConsent);
    },
    onTimeout: function (timeoutData) {
        utils.logWarn(`onTimeout -> timeoutData:`, timeoutData);
    },
    onBidWon: function (bid) {
        utils.logInfo(`onBidWon -> bid:`, bid);
    },
    onSetTargeting: function (bid) {
        utils.logInfo(`onSetTargeting -> bid:`, bid);
    }
};

registerBidder({
    code: BIDDER_CODES.RTB_2_4,
    ...spec
});
