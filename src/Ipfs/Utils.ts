export const getRepoPath = () => {
  const repoPath =
    "/tmp/ipfs-test-" +
    Math.random()
      .toString()
      .substring(2, 8);
  return repoPath;
};
