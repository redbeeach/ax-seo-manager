<?php
/**
 * Place this file in the Gnuboard root as ax-seo-export.php.
 * AX SEO Manager calls it from /api/gb5/import.
 */
include_once('./_common.php');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-GB5-Secret');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Set this to the same value as Vercel's GB5_SYNC_SECRET or GB5_IMPORT_SECRET.
// If Cafe24 environment variables are unavailable, replace CHANGE_ME with the
// actual secret, but keep the check below comparing against CHANGE_ME only.
$secret = getenv('GB5_SYNC_SECRET') ?: 'CHANGE_ME';
$headerSecret = $_SERVER['HTTP_X_GB5_SECRET'] ?? '';

if (!$secret || $secret === 'CHANGE_ME' || !hash_equals($secret, $headerSecret)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication failed.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = [];
}

$boTables = $input['bo_tables'] ?? [];
$pageSlugs = $input['page_slugs'] ?? [];
$limit = isset($input['limit']) ? max(1, min((int) $input['limit'], 200)) : 50;

if (!is_array($boTables)) {
    $boTables = array_filter(array_map('trim', explode(',', (string) $boTables)));
}

if (!is_array($pageSlugs)) {
    $pageSlugs = array_filter(array_map('trim', explode(',', (string) $pageSlugs)));
}

function ax_clean_key($value) {
    return preg_replace('/[^a-zA-Z0-9_]/', '', trim((string) $value));
}

function ax_page_path($slug) {
    $slug = preg_replace('/[^a-zA-Z0-9_-]/', '', trim((string) $slug));
    return G5_PATH . '/sub/' . $slug . '.php';
}

$posts = [];

foreach ($boTables as $boTable) {
    $boTable = ax_clean_key($boTable);
    if (!$boTable) {
        continue;
    }

    $writeTable = $g5['write_prefix'] . $boTable;
    $safeLimit = (int) $limit;
    $sql = " select wr_id, wr_subject, wr_content
               from {$writeTable}
              where wr_is_comment = 0
              order by wr_id desc
              limit {$safeLimit} ";
    $result = sql_query($sql, false);

    if (!$result) {
        continue;
    }

    while ($row = sql_fetch_array($result)) {
        $posts[] = [
            'bo_table' => $boTable,
            'wr_id' => (string) $row['wr_id'],
            'title' => $row['wr_subject'],
            'content' => $row['wr_content'],
        ];
    }
}

$pages = [];

foreach ($pageSlugs as $slug) {
    $slug = preg_replace('/[^a-zA-Z0-9_-]/', '', trim((string) $slug));
    if (!$slug) {
        continue;
    }

    $path = ax_page_path($slug);
    if (!is_file($path)) {
        continue;
    }

    $html = file_get_contents($path);
    $title = $slug;

    if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $matches)) {
        $title = trim(strip_tags($matches[1]));
    }

    $pages[] = [
        'slug' => $slug,
        'title' => $title,
        'content' => $html,
        'canonical_url' => G5_URL . '/sub/' . $slug . '.php',
    ];
}

echo json_encode([
    'posts' => $posts,
    'pages' => $pages,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
