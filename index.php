<?php
declare( strict_types = 1 );

use DanielWebsite\Router;

require_once __DIR__ . '/src/setup.php';

$page = Router::pageForRequest(
	$_SERVER['REQUEST_METHOD'],
	$_SERVER['REQUEST_URI']
);

echo $page->getPageOutput();
