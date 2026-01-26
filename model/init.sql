CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    code VARCHAR(255),
    image VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_date TIMESTAMPTZ,
    is_subscribed BOOLEAN DEFAULT FALSE,
    badge VARCHAR(255),
    subscription_amount BIGINT,
    block BOOLEAN DEFAULT FALSE,
    device_id TEXT,
    customer_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Ensure existing installations have nullable device_id
ALTER TABLE IF EXISTS public.users ALTER COLUMN device_id DROP NOT NULL;
CREATE TABLE IF NOT EXISTS public.app_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.item_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.disc_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.disc_sub_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    category_id INT REFERENCES disc_category(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.video_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.video_sub_category (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES video_category(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.xpi_videos (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    video_category INT REFERENCES video_category(id) ON DELETE CASCADE NOT NULL,
    sub_category INT REFERENCES video_sub_category(id) ON DELETE CASCADE NOT NULL,
    video TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    -- top BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.video_comment (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES xpi_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.like_video (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES xpi_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.viewed_video (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES xpi_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.top_video (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    video_category INT REFERENCES video_category(id) ON DELETE CASCADE NOT NULL,
    video VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.pic_category (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
french_name VARCHAR(255),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.pic_sub_category (
id SERIAL PRIMARY KEY,
category_id INT REFERENCES pic_category(id) ON DELETE CASCADE NOT NULL,
name VARCHAR(255) NOT NULL,
french_name VARCHAR(255),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.pic_tours (
id SERIAL PRIMARY KEY,
user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
name VARCHAR(255) NOT NULL,
description TEXT NOT NULL,
pic_category INT REFERENCES pic_category(id) ON DELETE CASCADE NOT NULL,
sub_category INT REFERENCES pic_sub_category(id) ON DELETE CASCADE NOT NULL,
image VARCHAR(255) NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.top_tours (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
description TEXT NOT NULL,
pic_category INT REFERENCES pic_category(id) ON DELETE CASCADE NOT NULL,
image VARCHAR(255) NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.pic_comment (
id SERIAL PRIMARY KEY,
pic_tours_id INT REFERENCES pic_tours(id) ON DELETE CASCADE NOT NULL,
user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
comment TEXT NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.like_pic (
id SERIAL PRIMARY KEY,
pic_tours_id INT REFERENCES pic_tours(id) ON DELETE CASCADE NOT NULL,
user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.viewed_pic (
id SERIAL PRIMARY KEY,
pic_tours_id INT REFERENCES pic_tours(id) ON DELETE CASCADE NOT NULL,
user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.QAFI_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.QAFI_sub_category (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES QAFI_category(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.QAFI (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    -- name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category INT REFERENCES QAFI_category(id) ON DELETE CASCADE NOT NULL,
    sub_category INT REFERENCES QAFI_sub_category(id) ON DELETE CASCADE NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.top_QAFI (
    id SERIAL PRIMARY KEY,
    -- name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    disc_category INT REFERENCES disc_category(id) ON DELETE CASCADE NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.qafi_comment (
    id SERIAL PRIMARY KEY,
    QAFI_id INT REFERENCES QAFI(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.like_qafi (
    id SERIAL PRIMARY KEY,
    QAFI_id INT REFERENCES QAFI(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- GEBC tables.......................................................
-- GEBC tables.......................................................
CREATE TABLE IF NOT EXISTS public.GEBC_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.GEBC_sub_category (
id SERIAL PRIMARY KEY,
category_id INT REFERENCES GEBC_category(id) ON DELETE CASCADE NOT NULL,
name VARCHAR(255) NOT NULL,
french_name VARCHAR(255),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.GEBC (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    -- name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category INT REFERENCES GEBC_category(id) ON DELETE CASCADE NOT NULL,
    sub_category INT REFERENCES GEBC_sub_category(id) ON DELETE CASCADE NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.top_GEBC (
    id SERIAL PRIMARY KEY,
    -- name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    disc_category INT REFERENCES disc_category(id) ON DELETE CASCADE NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.GEBC_comment (
    id SERIAL PRIMARY KEY,
    GEBC_id INT REFERENCES GEBC(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.like_GEBC (
    id SERIAL PRIMARY KEY,
    GEBC_id INT REFERENCES GEBC(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- News tables.......................................................
-- News tables.......................................................
CREATE TABLE IF NOT EXISTS public.NEWS_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.NEWS_sub_category (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES NEWS_category(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.NEWS (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    -- name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category INT REFERENCES NEWS_category(id) ON DELETE CASCADE NOT NULL,
    sub_category INT REFERENCES NEWS_sub_category(id) ON DELETE CASCADE NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.top_NEWS (
    id SERIAL PRIMARY KEY,
    -- name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    disc_category INT REFERENCES disc_category(id) ON DELETE CASCADE NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.NEWS_comment (
    id SERIAL PRIMARY KEY,
    NEWS_id INT REFERENCES NEWS(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.like_NEWS (
    id SERIAL PRIMARY KEY,
    NEWS_id INT REFERENCES NEWS(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.signature (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.post_letters (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    post_type VARCHAR(10) NOT NULL CHECK (post_type IN ('public', 'private')),
    receiver_type VARCHAR(20) NOT NULL,
    disc_category INT REFERENCES disc_category(id) ON DELETE CASCADE NOT NULL,
    disc_sub_category INT REFERENCES disc_sub_category(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL NOT NULL,
    email VARCHAR(100) NOT NULL,
    contact_no VARCHAR(20) NOT NULL,
    subject_place VARCHAR(100) NOT NULL,
    post_date DATE NOT NULL,
    greetings TEXT NOT NULL,
    introduction TEXT NOT NULL,
    body TEXT NOT NULL,
    -- description TEXT NOT NULL,
    form_of_appeal TEXT NOT NULL,
    video VARCHAR(255),
    signature_id INT REFERENCES signature(id) ON DELETE CASCADE NOT NULL,
    paid_status BOOLEAN NOT NULL,
    top_letter BOOLEAN DEFAULT FALSE,
    top_added_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW() CONSTRAINT check_paid_status CHECK (paid_status = (post_type = 'private')),
    CONSTRAINT check_receiver_type CHECK (
        (
            post_type = 'public'
            AND receiver_type IN (
                'general',
                'celebrities',
                'authorities',
                'leader'
            )
        )
        OR (
            post_type = 'private'
            AND receiver_type IN (
                'peers',
                'friends',
                'followers',
                'celebrities',
                'authorities',
                'leader'
            )
        )
    )
);
CREATE TABLE IF NOT EXISTS public.post_letters_images (
    id SERIAL PRIMARY KEY,
    letter_id INT REFERENCES post_letters(id) ON DELETE CASCADE NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.letter_reciever_info (
    id SERIAL PRIMARY KEY,
    letter_id INT REFERENCES post_letters(id) ON DELETE CASCADE NOT NULL,
    reciever_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.item (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    item_category INT REFERENCES item_category(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price BIGINT NOT NULL,
    condition VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    top_post BOOLEAN NOT NULL DEFAULT FALSE,
    top_added_date TIMESTAMPTZ,
    paid_status BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_condition_type CHECK (
        condition IN ('new', 'used_Like_new', 'used_Good', 'used_Fair')
    )
);
CREATE TABLE IF NOT EXISTS public.item_images (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES item(id) ON DELETE CASCADE NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.send_offer (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES item(id) ON DELETE CASCADE NOT NULL,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    price BIGINT NOT NULL,
    status VARCHAR(255) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.save_item (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES item(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.banner_configuration (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    length BIGINT NOT NULL,
    width BIGINT NOT NULL,
    cost BIGINT NOT NULL,
    top_banner_cost BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.banner (
    id SERIAL PRIMARY KEY,
    image VARCHAR(255) NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    banner_link TEXT NOT NULL,
    price BIGINT NOT NULL,
    startDate Date NOT NULL,
    endDate Date NOT NULL,
    status VARCHAR(255) DEFAULT 'inactive' NOT NULL,
    top_banner BOOLEAN NOT NULL DEFAULT FALSE,
    paid_status BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_status_type CHECK (status IN ('active', 'inactive')),
    --  CONSTRAINT check_valid_banner_link CHECK (banner_link ~* '^www.[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}.*$'),
    CONSTRAINT check_valid_banner_link CHECK (
        banner_link::text ~* 'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,255}\.[a-z]{2,9}\y([-a-zA-Z0-9@:%_\+.~#?&//=]*)$'::text
    ),
    CONSTRAINT check_valid_paid_status CHECK (paid_status IN (true, false))
);
CREATE TABLE IF NOT EXISTS public.rate_app (
    id SERIAL PRIMARY KEY,
    link TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_valid_link CHECK (
        link ~* 'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,255}\.[a-z]{2,9}\y([-a-zA-Z0-9@:%_\+.~#?&//=]*)$'
    )
);
CREATE TABLE IF NOT EXISTS public.share_app (
    id SERIAL PRIMARY KEY,
    link TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_valid_link_updated CHECK (
        link ~* 'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,255}\.[a-z]{2,9}\y([-a-zA-Z0-9@:%_\+.~#?&//=]*)$'
    )
);
CREATE TABLE IF NOT EXISTS public.contact_us (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(255) DEFAULT 'unread' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_valid_status CHECK (status IN ('read', 'unread')) --    CONSTRAINT check_valid_email_format CHECK (email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
);
CREATE TABLE IF NOT EXISTS public.mass_app (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    app_category_id INT REFERENCES app_category(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_valid_status CHECK (
        type IN (
            'favourites',
            'new_added',
            'phone_based',
            'unused_app',
            'top'
        )
    )
);
CREATE TABLE IF NOT EXISTS public.payment (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    payment_detail jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.notification_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.notification (
    id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type INT REFERENCES notification_type(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- **************** cinematics *******************
CREATE TABLE IF NOT EXISTS public.cinematics_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.cinematics_sub_category (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES cinematics_category(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.cinematics_videos (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INT REFERENCES cinematics_category(id) ON DELETE CASCADE NOT NULL,
    sub_category_id INT REFERENCES cinematics_sub_category(id) ON DELETE CASCADE NOT NULL,
    video TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.cinematics_video_comment (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES cinematics_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.cinematics_video_like (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES cinematics_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.cinematics_video_viewed (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES cinematics_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- **************** cinematics *******************
-- **************** fan star *******************
CREATE TABLE IF NOT EXISTS public.fan_star_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.fan_star_sub_category (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES fan_star_category(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.fan_star_videos (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INT REFERENCES fan_star_category(id) ON DELETE CASCADE NOT NULL,
    sub_category_id INT REFERENCES fan_star_sub_category(id) ON DELETE CASCADE NOT NULL,
    video TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.fan_star_video_comment (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES fan_star_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.fan_star_video_like (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES fan_star_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.fan_star_video_viewed (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES fan_star_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- **************** fan star *******************
-- **************** tv progmax *******************
CREATE TABLE IF NOT EXISTS public.tv_progmax_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.tv_progmax_sub_category (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES tv_progmax_category(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.tv_progmax_videos (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INT REFERENCES tv_progmax_category(id) ON DELETE CASCADE NOT NULL,
    sub_category_id INT REFERENCES tv_progmax_sub_category(id) ON DELETE CASCADE NOT NULL,
    video TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.tv_progmax_video_comment (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES tv_progmax_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.tv_progmax_video_like (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES tv_progmax_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.tv_progmax_video_viewed (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES tv_progmax_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- **************** tv progmax *******************
-- **************** kid vids *******************
CREATE TABLE IF NOT EXISTS public.kid_vids_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.kid_vids_sub_category (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES kid_vids_category(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.kid_vids_videos (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INT REFERENCES kid_vids_category(id) ON DELETE CASCADE NOT NULL,
    sub_category_id INT REFERENCES kid_vids_sub_category(id) ON DELETE CASCADE NOT NULL,
    video TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.kid_vids_video_comment (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES kid_vids_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.kid_vids_video_like (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES kid_vids_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.kid_vids_video_viewed (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES kid_vids_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- **************** kid vids *******************
-- **************** learning and hobbies *******************
CREATE TABLE IF NOT EXISTS public.learning_hobbies_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.learning_hobbies_sub_category (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES learning_hobbies_category(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.learning_hobbies_videos (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INT REFERENCES learning_hobbies_category(id) ON DELETE CASCADE NOT NULL,
    sub_category_id INT REFERENCES learning_hobbies_sub_category(id) ON DELETE CASCADE NOT NULL,
    video TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.learning_hobbies_video_comment (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES learning_hobbies_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.learning_hobbies_video_like (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES learning_hobbies_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.learning_hobbies_video_viewed (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES learning_hobbies_videos(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- **************** kid vids *******************
-- ********** saving cards | transactions ************
CREATE TABLE IF NOT EXISTS cards(
    id SERIAL PRIMARY KEY,
    customer_id TEXT,
    card_id TEXT,
    exp_month TEXT,
    exp_year TEXT,
    last_digit TEXT,
    finger_print TEXT,
    brand_name TEXT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS transactions(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    banner_id INT REFERENCES banner(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    credit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- **************** sports *******************
CREATE TABLE IF NOT EXISTS public.sports_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sport_sub_category (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES sports_category(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    french_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sports (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INT REFERENCES sports_category(id) ON DELETE CASCADE NOT NULL,
    sub_category_id INT REFERENCES sport_sub_category(id) ON DELETE CASCADE NOT NULL,
    image TEXT NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sport_comment (
    id SERIAL PRIMARY KEY,
    sport_id INT REFERENCES sports(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Note: comments for marketplace items are stored in `mondon_market_comment`.
-- Link comments to the existing `item` table (item.id) to reuse items.
CREATE TABLE IF NOT EXISTS public.mondon_market_comment (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES item(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sport_like (
    id SERIAL PRIMARY KEY,
    sport_id INT REFERENCES sports(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS public.alerts(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    category_id INT REFERENCES item_category(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
