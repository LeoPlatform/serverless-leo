"use strict";

module.exports = {
  test: {
    region: "us-east-1",
    leosdk: {
      Region: "us-east-1",
      LeoArchive: "TestBus-LeoArchive-XXXXXXXXX",
      LeoCron: "TestBus-LeoCron-XXXXXXXXX",
      LeoEvent: "TestBus-LeoEvent-XXXXXXXXX",
      LeoFirehoseStream: "TestBus-LeoFirehoseStream-XXXXXXXXX",
      LeoKinesisStream: "TestBus-LeoKinesisStream-XXXXXXXXX",
      LeoS3: "testbus-leos3-XXXXXXXXX",
      LeoSettings: "TestBus-LeoSettings-XXXXXXXXX",
      LeoStream: "TestBus-LeoStream-XXXXXXXXX",
      LeoSystem: "TestBus-LeoSystem-XXXXXXXXX",
    }
  },
  staging: {
    region: "us-east-1",
    leosdk: {
      LeoStream: "StagingBus-LeoStream-XXXXXXXXX",
      LeoCron: "StagingBus-LeoCron-XXXXXXXXX",
      LeoSettings: "StagingBus-LeoSettings-XXXXXXXXX",
      LeoEvent: "StagingBus-LeoEvent-XXXXXXXXX",
      LeoSystem: "StagingBus-LeoSystem-XXXXXXXXX",
      LeoArchive: "StagingBus-LeoArchive-XXXXXXXXX",
      LeoKinesisStream: "StagingBus-LeoKinesisStream-XXXXXXXXX",
      LeoFirehoseStream: "StagingBus-LeoFirehoseStream-XXXXXXXXX",
      LeoS3: "stagingbus-leos3-XXXXXXXXX",
      Region: "us-east-1",
    }
  },
  prod: {
    region: "us-east-1",
    leosdk: {
      LeoStream: "ProdBus-LeoStream-XXXXXXXXX",
      LeoCron: "ProdBus-LeoCron-XXXXXXXXX",
      LeoEvent: "ProdBus-LeoEvent-XXXXXXXXX",
      LeoSettings: "ProdBus-LeoSettings-XXXXXXXXX",
      LeoSystem: "ProdBus-LeoSystem-XXXXXXXXX",
      LeoArchive: "ProdBus-LeoArchive-XXXXXXXXX",
      LeoKinesisStream: "ProdBus-LeoKinesisStream-XXXXXXXXX",
      LeoFirehoseStream: "ProdBus-LeoFirehoseStream-XXXXXXXXX",
      LeoS3: "prodbus-leos3-XXXXXXXXX",
      Region: "us-east-1",
    }
  },
};
