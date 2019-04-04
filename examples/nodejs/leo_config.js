"use strict";

module.exports = {
    _global: {
        region: "us-east-1",
    },
    test: {
        leoaws: {
            region: 'us-east-1'
        },
        leosdk: {
            LeoStream: "TestBus-LeoStream-XYZABC456123",
            LeoCron: "TestBus-LeoCron-XYZABC456123",
            LeoSettings: "TestBus-LeoSettings-XYZABC456123",
            LeoEvent: "TestBus-LeoEvent-XYZABC456123",
            LeoSystem: "TestBus-LeoSystem-XYZABC456123",
            LeoArchive: "TestBus-LeoArchive-XYZABC456123",
            LeoKinesisStream: "TestBus-LeoKinesisStream-XYZABC456123",
            LeoFirehoseStream: "TestBus-LeoFirehoseStream-XYZABC456123",
            LeoS3: "testbus-leos3-xyzabc456123",
            Region: "us-east-1"
        },
        leoauth: {
            LeoAuthIdentity: "TestAuth-LeoAuthIdentity-XYZABC456123",
            LeoAuthPolicy: "TestAuth-LeoAuthPolicy-XYZABC456123",
            LeoAuth: "TestAuth-LeoAuth-XYZABC456123",
            LeoAuthUser: "TestAuth-LeoAuthUser-XYZABC456123",
            Region: "us-east-1"
        }
    }
};