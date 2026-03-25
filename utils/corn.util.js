export const updateBannerStatus = async () => {
  const query = `
    UPDATE public.banner
    SET status = 'inactive',
        updated_at = NOW()
    WHERE endDate < CURRENT_DATE AND status = 'active';
  `;

  try {
    await client.query(query);
    console.log("Banner statuses updated successfully");
  } catch (err) {
    console.error("Error updating banner statuses", err);
  }
};
