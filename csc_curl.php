<?php
class curl {
	private $useragent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:13.0) Gecko/20100101 Firefox/13.0';
	private $handle;
	private $cookies;
	private $redirs;
	public $cookiejar;
	public $data;
	public $code;
	public $url;
	public $info;
	public $bc;

	public function __construct( $redirs = true, $cookies = true, $useragent=true ) {
		$this->useragent = ( $useragent ) ? $useragent : $this->useragent;
		$this->redirs = $redirs;
		$this->cookies = $cookies;
		$this->cookiejar = 'cookies.txt';
	}

	public function setopt( $url ) {
		curl_setopt( $this->handle, CURLOPT_URL, $url );
		curl_setopt( $this->handle, CURLOPT_USERAGENT, $this->useragent );
		curl_setopt( $this->handle, CURLOPT_RETURNTRANSFER, true );
		curl_setopt( $this->handle, CURLOPT_CONNECTTIMEOUT, 5 );

		if ( $url[4] == 's' ) {
			curl_setopt( $this->handle, CURLOPT_SSL_VERIFYPEER, false );
			curl_setopt( $this->handle, CURLOPT_SSL_VERIFYHOST, false );
		}

		if ( $this->redirs ) {
			curl_setopt( $this->handle, CURLOPT_FOLLOWLOCATION, true );
			curl_setopt( $this->handle, CURLOPT_MAXREDIRS, 10 );
		}

		if ( $this->cookies ) {
			curl_setopt( $this->handle, CURLOPT_COOKIEFILE, $this->cookiejar );
			curl_setopt( $this->handle, CURLOPT_COOKIEJAR, $this->cookiejar );
		}
	}

	public function post( $url, $array ) {
		$this->handle = curl_init();
		$this->setopt( $url );
		curl_setopt( $this->handle, CURLOPT_POST, true );
		curl_setopt( $this->handle, CURLOPT_POSTFIELDS, $array );
		$this->data = curl_exec( $this->handle );
		$this->code = curl_getinfo( $this->handle, CURLINFO_HTTP_CODE );
		$this->info = curl_getinfo( $this->handle );
		curl_close( $this->handle );
		return $this->data;
	}

	public function get( $url ) {
		$this->handle = curl_init();
		$this->setopt( $url );
		$this->data = curl_exec( $this->handle );
		$this->code = curl_getinfo( $this->handle, CURLINFO_HTTP_CODE );
		$this->info = curl_getinfo( $this->handle );
		curl_close( $this->handle );
		return $this->data;
	}

	/* Explode html */
	public function xp( $p, $t, $j=1, $o=null ) {
		if ( $o==null ) $o = $this->bc;
		if ( ! is_numeric( $j ) ) {
			$o = $j;
			$j = 1;
		}
		$xp = explode( $p, $o );
		$r = isset( $xp[$j] ) ? explode( $t, $xp[$j] )[0] : null;
		return $r;
	}

}

$c = new curl;
$c->bc = $c->get( 'http://localhost:3000/wooapi/getdata?cs=cs_nina&ck=ck_nina&url=ninaalisia.com&token=vx1U727gkSsMoJuM&idcust=8&tp=277&tc=958&to=204' );
