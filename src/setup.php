<?php
declare( strict_types = 1 );

/**
 * Set up everything that I need (like error reporting, sessions, and
 * autoloading). This should be the first thing included in all entry points.
 */

ini_set( 'display_errors', 1 );
ini_set( 'display_startup_errors', 1 );
error_reporting( E_ALL );
ini_set( 'date.timezone', 'UTC' );

if ( ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) === 'POST' ) {
	ignore_user_abort( true );
}

// Session
// session_start();

// Autoloading from composer
require_once __DIR__ . '/../vendor/autoload.php';

set_exception_handler( [ \DanielWebsite\Pages\InternalErrorPage::class, 'handleException' ] );
