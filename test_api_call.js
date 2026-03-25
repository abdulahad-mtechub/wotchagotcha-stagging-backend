import axios from 'axios';

async function testApi() {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsImlhdCI6MTc3MTYwNTIxNSwiZXhwIjoxNzc0MTk3MjE1fQ.QulRXJx-VfGy5U2O3MHhGKyrhZqohPr3D4mQmJ2AKOU";
    const catId = 38;
    const url = `http://localhost:3801/xpi/getAllVideosBycategory/${catId}?page=1&limit=1000`;

    try {
        console.log(`Calling API: ${url}`);
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log(`Response Status: ${response.status}`);
        const data = response.data;

        if (data.data) {
            console.log(`Groups returned: ${data.data.length}`);
            let found = false;
            data.data.forEach(group => {
                const video = group.video_result.Videos.find(v => v.video_id === 2014);
                if (video) {
                    console.log(`FOUND record 2014 in group: ${group.sub_category_name}`);
                    found = true;
                }
            });

            if (!found) {
                console.log("Record 2014 NOT found in API response data.");
            }
        } else {
            console.log("No 'data' field in response.");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("API call failed:", error.message);
        if (error.response) {
            console.log("Error Response:", JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        process.exit();
    }
}

testApi();
