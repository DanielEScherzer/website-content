<?php
declare( strict_types = 1 );

/**
 * Generic page, not just for HTML
 */

namespace DanielWebsite\Pages;

use DanielWebsite\WebResponse;

abstract class AbstractPage {

	abstract public function getResponse(): WebResponse;

}
