-- 注册时自动在 users 表创建记录（邮箱验证模式下必须）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  _username TEXT;
  _nickname TEXT;
  _adjectives TEXT[] := ARRAY['快乐的','勇敢的','聪明的','幸运的','可爱的','酷酷的','神秘的','闪亮的','温柔的','无敌的','潇洒的','呆萌的','霸气的','暖心的','搞笑的'];
  _animals TEXT[] := ARRAY['小海豚','小鲸鱼','小海鸥','小章鱼','小水母','小海星','小螃蟹','小鲨鱼','小海马','小贝壳','小浪花','小帆船','小灯塔','小企鹅','小北极熊'];
BEGIN
  _username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  _nickname := _adjectives[1 + floor(random() * array_length(_adjectives, 1))::int]
             || _animals[1 + floor(random() * array_length(_animals, 1))::int]
             || (floor(random() * 999) + 1)::text;

  INSERT INTO public.users (id, username, email, name, avatar, bio, tags, points, level)
  VALUES (NEW.id, _username, NEW.email, _nickname, '👤', '', ARRAY[]::text[], 100, 1)
  ON CONFLICT (id) DO NOTHING;

  -- 种子用户成就（前 10000 名）
  IF (SELECT count(*) FROM public.users) < 10000 THEN
    INSERT INTO public.user_achievements (user_id, achievement_id, achievement_name, achievement_icon, reward_points)
    VALUES (NEW.id, 'seed-user', '种子用户', '🌱', 200)
    ON CONFLICT DO NOTHING;

    UPDATE public.users SET points = points + 200 WHERE id = NEW.id;

    INSERT INTO public.point_records (user_id, amount, type, description)
    VALUES (NEW.id, 200, 'achievement', '解锁成就：种子用户');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
