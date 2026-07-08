/**
 * Generates a permanent Meraki vehicle identity.
 * Format: MC-XXXXXXXX (alphanumeric, uppercase)
 * This ID survives plate changes, ownership transfers and
 * any administrative modifications to the vehicle record.
 */
const generateMerakiId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed ambiguous chars: 0,O,1,I
  let id = 'MC-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

module.exports = { generateMerakiId };
