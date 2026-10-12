'use strict';
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const sizes=[['small',250,175],['large',500,350],['xlarge',1000,700]];
const crop={left:120,top:600,width:1780,height:1246};
// Mechanical exports of the photograph documented in ASSET-LICENSES.md.
// No logo, text or synthetic artwork is added.
async function build(sourcePath){
  if(!sourcePath)throw Error('Usage: node scripts/branding.js <licensed-source-photo.jpg>');
  const metadata=await sharp(sourcePath).metadata();
  if(metadata.width<2000||metadata.height<1846)throw Error('Use the original portrait photo at width 2000 pixels.');
  fs.mkdirSync(path.join('assets','images'),{recursive:true});
  for(const [name,width,height]of sizes){
    await sharp(sourcePath).rotate().extract(crop)
      .resize(width,height,{fit:'cover'}).png({compressionLevel:9}).toFile(path.join('assets','images',name+'.png'));
  }
}
if(require.main===module)build(process.argv[2]).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={build,sizes,crop};
