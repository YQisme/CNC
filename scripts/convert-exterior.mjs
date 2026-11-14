import fs from "fs";

const srcPath = "e:/Desktop/CNC/src/components/cnc/machines/Sf260Exterior.tsx";
const src = fs.readFileSync(srcPath, "utf8");

const marker = '<group ref={rootRef} position={[cx, 0, cz]} name="SF260_Exterior">';
const returnIdx = src.lastIndexOf(marker);
if (returnIdx < 0) {
  console.error("return not found");
  process.exit(1);
}
// go back to "return ("
const retStart = src.lastIndexOf("return (", returnIdx);
let jsx = src.slice(retStart + "return (".length);
jsx = jsx.replace(/\);\s*\}\s*$/, "");

function convertJsx(s) {
  s = s.replace(/\bref=\{(\w+)\}/g, 'ref="$1"');
  s = s.replace(/\bkey=\{([^}]+)\}/g, ':key="$1"');
  s = s.replace(
    /(\s)(position|rotation|args|scale|offset)=\{(\[[^\]]*\])\}/g,
    ':$2="$3"',
  );
  s = s.replace(
    /(\s)(amount|material|mat|metal|rubber|points|axis|width|height|bar|depth|size|at|radius|smoothness|bevelSegments|fontSize|letterSpacing|color|anchorX|anchorY|renderOrder)=\{([^}]+)\}/g,
    (m, sp, name, val) => {
      const kebab = name.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${sp}:${kebab}="${val.trim()}"`;
    },
  );
  s = s.replace(/\s+castShadow(?=\s|\/|>)/g, " cast-shadow");
  s = s.replace(/\s+receiveShadow(?=\s|\/|>)/g, " receive-shadow");
  s = s.replace(/<\/?group\b/g, (m) => m.replace("group", "TresGroup"));
  s = s.replace(/<\/?mesh\b/g, (m) => m.replace("mesh", "TresMesh"));
  s = s.replace(/<boxGeometry\b/g, "<TresBoxGeometry");
  s = s.replace(/<\/boxGeometry>/g, "</TresBoxGeometry>");
  s = s.replace(/<cylinderGeometry\b/g, "<TresCylinderGeometry");
  s = s.replace(/<\/cylinderGeometry>/g, "</TresCylinderGeometry>");
  s = s.replace(/<planeGeometry\b/g, "<TresPlaneGeometry");
  s = s.replace(/<\/planeGeometry>/g, "</TresPlaneGeometry>");
  s = s.replace(/<sphereGeometry\b/g, "<TresSphereGeometry");
  s = s.replace(/<\/sphereGeometry>/g, "</TresSphereGeometry>");
  s = s.replace(
    /<Text[\s\S]*?<\/Text>/g,
    "<!-- Text label omitted; logo texture remains -->",
  );
  return s;
}

const converted = convertJsx(jsx);
fs.writeFileSync("e:/Desktop/CNC/scripts/_exterior_template.txt", converted);
console.log("ok", converted.length, "start", converted.slice(0, 200));
