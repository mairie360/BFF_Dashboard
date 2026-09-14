-- Seed minimal pour les tests isolés (performance / sécurité) du BFF Dashboard.
-- L'utilisateur 2 est celui référencé par les JWT de test (claim sub = "2") :
--   * load-test.js le signe dynamiquement,
--   * docker-compose-security.yml injecte un token statique via le replacer ZAP.
--
-- /dashboard/bootstrap ne renvoie une erreur (non-200) que si Core API refuse la
-- session : il suffit donc que l'utilisateur existe. Les listes projets / tâches /
-- événements peuvent rester vides (elles sont alors signalées comme "available"
-- mais sans contenu). Un seed plus riche peut être ajouté ici si l'on veut
-- exercer les chemins d'agrégation avec des données.

INSERT INTO users (id, first_name, last_name, email, password, status)
VALUES (2, 'Perf', 'Tester', 'perf-tester@mairie360.fr', 'dummy', 'active')
ON CONFLICT (id) DO NOTHING;

-- Core API >= 1.1.1 exige au moins un rôle sur l'utilisateur pour GET /user/me
-- (sinon panic "index out of bounds" côté Core). Le rôle "User" ne donne pas
-- l'accès admin.
INSERT INTO user_roles (user_id, role_id)
SELECT 2, r.id FROM roles r WHERE lower(r.name) = 'user'
ON CONFLICT DO NOTHING;
