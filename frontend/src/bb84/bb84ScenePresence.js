/** Short stage status so learners know where photons are and who acts. */
export function scenePresence(sceneId, { eveMotionLeg, eveEnabled }) {
  switch (sceneId) {
    case 'message':
      return { where: 'Message', who: 'Alice', detail: 'Plaintext not on the wire yet' };
    case 'bases':
      return { where: 'Alice', who: 'Alice', detail: 'Random + / × basis per photon' };
    case 'encode':
      return { where: 'Alice', who: 'Alice', detail: 'Bit encoded into polarization' };
    case 'transmit':
      return {
        where: 'Quantum channel',
        who: 'In transit',
        detail: eveEnabled ? 'Alice → Eve along quantum link' : 'Alice → Bob along quantum link',
      };
    case 'eve':
      if (eveMotionLeg === 'toBob') {
        return { where: 'Quantum channel', who: 'In transit', detail: 'Eve → Bob (resent photons)' };
      }
      return { where: 'Eve', who: 'Eve', detail: 'Measure → collapse → resend' };
    case 'measure':
      return { where: 'Bob', who: 'Bob', detail: 'Random basis measurement' };
    case 'compare':
      return { where: 'Classical channel', who: 'Alice & Bob', detail: 'Bases published — not bits' };
    case 'sift':
      return { where: 'Classical', who: 'Alice & Bob', detail: 'Drop mismatched bases' };
    case 'verify':
      return { where: 'Classical', who: 'Alice & Bob', detail: 'Sample bits for error rate' };
    case 'finale':
      return { where: 'Shared key', who: 'Alice & Bob', detail: 'Same sifted secret' };
    default:
      return null;
  }
}
