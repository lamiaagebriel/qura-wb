-- People can't vote on their own posts (the vote action refuses it since
-- 2026-10-19): remove the votes that were cast before.
DELETE FROM "post_votes" v USING "posts" p
WHERE p.id = v.post_id AND v.user_id = p.created_by_id;
