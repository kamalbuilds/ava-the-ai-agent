// Create constraints
CREATE CONSTRAINT portfolio_id IF NOT EXISTS FOR (p:Portfolio) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT token_address IF NOT EXISTS FOR (t:Token) REQUIRE t.address IS UNIQUE;

// Create indexes
CREATE INDEX portfolio_strategy IF NOT EXISTS FOR (p:Portfolio) ON (p.strategy);
CREATE INDEX token_symbol IF NOT EXISTS FOR (t:Token) ON (t.symbol); 