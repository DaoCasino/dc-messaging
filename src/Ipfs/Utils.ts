import Ipfs from "ipfs";
import IpfsRepo from "ipfs-repo";
import Channel from "ipfs-pubsub-room";

import rimraf from "rimraf";
import fs from "fs";

const clean = dir => {
  try {
    fs.accessSync(dir);
  } catch (err) {
    return;
  }
  rimraf.sync(dir);
};

export const createTempRepo = (): IpfsRepo => {
  const repoPath =
    "/tmp/ipfs-test-" +
    Math.random()
      .toString()
      .substring(2, 8);
  let destroyed = false;

  const repo = new IpfsRepo(repoPath, {});
  const repoAny: any = repo;
  repoAny.teardown = done => {
    if (destroyed) {
      return;
    }
    destroyed = true;
    repo.close(() => clean(repoPath));
  };

  return repo;
};
