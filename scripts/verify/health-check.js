const repo=require('../../services/data/repository'); console.log(JSON.stringify({ok:true,counts:repo.counts()},null,2));
