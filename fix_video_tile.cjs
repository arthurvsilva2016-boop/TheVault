const fs = require('fs');
let code = fs.readFileSync('src/components/calling/LiveVideoTile.tsx', 'utf8');

code = code.replace(
  `  useEffect(() => {
    if (videoRef.current && stream && participant.isVideoOn) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current && !participant.isVideoOn) {
      videoRef.current.srcObject = null;
    }
  }, [stream, participant.isVideoOn]);`,
  `  useEffect(() => {
    const videoObj = videoRef.current;
    if (videoObj && stream && participant.isVideoOn) {
      if (videoObj.srcObject !== stream) {
        videoObj.srcObject = stream;
      }
      videoObj.play().catch(e => console.warn("Video play failed:", e));
    } else if (videoObj && !participant.isVideoOn) {
      videoObj.srcObject = null;
    }
  }, [stream, participant.isVideoOn]);`
);

fs.writeFileSync('src/components/calling/LiveVideoTile.tsx', code);
