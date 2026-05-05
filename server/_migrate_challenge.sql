-- 每日造梗挑战
CREATE TABLE IF NOT EXISTS daily_challenges (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  topic_tag VARCHAR(50),
  reward_points INT DEFAULT 100,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  winner_id VARCHAR(36),
  entry_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS challenge_entries (
  id VARCHAR(36) PRIMARY KEY,
  challenge_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  meme_id VARCHAR(36),
  title VARCHAR(200),
  content TEXT NOT NULL,
  vote_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS challenge_votes (
  challenge_id VARCHAR(36) NOT NULL,
  entry_id VARCHAR(36) NOT NULL,
  voter_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (challenge_id, voter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PK对战
CREATE TABLE IF NOT EXISTS battles (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  side_a_title VARCHAR(100) NOT NULL,
  side_b_title VARCHAR(100) NOT NULL,
  side_a_votes INT DEFAULT 0,
  side_b_votes INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS battle_votes (
  battle_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  side ENUM('a','b') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (battle_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;