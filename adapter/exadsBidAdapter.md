# Overview

**Module Name**: Exads Bidder Adapter
**Module Type**: Bidder Adapter
**Maintainer**: blablabla@exads.com TODO!!!

# Description

Module that connects to Exads's bidder for bids.

# Test Parameters


RTB Banner 2.4 (Image)

```javascript
adUnits = [{
    code: 'postbid_iframe',
    mediaTypes: {
        banner: {
            sizes: [
                [300, 250]
            ]
        }
    },
    bids: [{
        bidder: 'exadsadserver_rtb_2_4',
        params: {
                zoneId: zoneId,
                fid: fid,
                siteId: siteId,
                catIab: catIab,
                userIp: 0,
                country: 'IRL',
                impressionId: impression_id.toString(),
                keywords: 'lifestyle, humour',
                bidfloor: 0.00000011,
                bidfloorcur: 'EUR',
                mimes: ['image/jpg'],
                image_output: "html",
                video_output: "html",
                endpoint: exads_endpoint
            }
        }]
    }];
```

RTB Banner (Video)

```javascript

 adUnits = [{
    code: 'postbid_iframe',
    mediaTypes: {
        banner: {
            sizes: bannerSizes
        }
    },
    bids: [{
        bidder: 'exadsadserver_rtb_2_4',
        params: {
                zoneId: zoneId,
                fid: fid,
                siteId: siteId,
                catIab: catIab,
                userIp: 0,
                country: 'ITA',
                impressionId: impression_id.toString(),
                keywords: 'lifestyle, humour',
                bidfloor: 0.00000011,
                bidfloorcur: 'EUR',
                mimes: ['video/mp4'],
                image_output: "html",
                video_output: "html",
                endpoint: exads_endpoint
            }
        }]
    }];
```

RTB Video (Instream/OutStream/Video Slider) - VAST XML or VAST TAG (url)

```javascript
 adUnits = [{
    code: 'postbid_iframe',
    mediaTypes: {
        video: {
            mimes: ['video/mp4'],
            context: 'instream', // or 'outstream'
            protocols: [3, 6],
            divId: 'player', // required to indicate which player is being used to render this ad unit.
        }
    },
    bids: [{
        bidder: 'exadsadserver_rtb_2_4',
        params: {
            zoneId: zoneId,
            fid: fid,
            siteId: siteId,
            userIp: 0, // DO NOT EDIT - Client side data
            impressionId: impression_id.toString(), // DO NOT EDIT - Custom hash
            stream: {
                video: {
                    mimes: ['video/mp4']
                },
                protocols: [
                    3,
                    6
                ],
                ext: {
                    video_cta: 0
                }
            },
            country: 'ITA',
            keywords: 'lifestyle, humour',
            catIab: catIab,
            endpoint: exads_endpoint
        }
    }]
}];
```

RTB Native

```javascript
adUnits = [{
    code: 'postbid_iframe',
    mediaTypes: {
        native: {
            sendTargetingKeys: true,
            ortb: {
                assets: [{
                    id: 1,
                    required: 1,
                    title: {
                        len: 124
                    }
                },
                {
                    id: 2,
                    data: {
                        type: 1,
                        len: 50
                    }
                },
                {
                    id: 3,
                    required: 1,
                    img: {
                        type: 3,
                        w: 300,
                        h: 300,
                    }
                }]
            }
        },
    },
    bids: [{
        bidder: 'exadsadserver_rtb_2_4',
        params: {
                zoneId: zoneId,
                fid: fid,
                siteId: siteId,
                catIab: catIab,
                keywords: 'lifestyle, humour',
                userIp: 0, // DO NOT EDIT - Client side data
                impressionId: impression_id.toString(), // DO NOT EDIT - Custom hash,
                native: {
                    plcmtcnt: 4,
                },
                bidfloor: 0.00000011,
                bidfloorcur: 'EUR',
                country: 'ITA',
                endpoint: exads_endpoint
            }
        }]
    }];
```