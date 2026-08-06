#!/usr/bin/env perl
use strict;
use warnings;
use File::Find;
use File::Basename;
use HTML::Entities;

my $base_url = "https://www.derinpinar.av.tr";
my $repo_root = dirname(dirname(__FILE__));

my @html_files = ();
find(sub {
    if (/\.html$/ && -f $_ && $_ !~ /[\(\)]/ && $File::Find::name !~ /\/\./) {
        push @html_files, $File::Find::name;
    }
}, $repo_root);

@html_files = sort @html_files;

# -------------------------------------------------------------
# GENERATE SITEMAP.XML
# -------------------------------------------------------------
open(my $sm_out, '>:encoding(UTF-8)', "$repo_root/sitemap.xml") or die $!;
print $sm_out "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
print $sm_out "<urlset xmlns=\"https://www.sitemaps.org/schemas/sitemap/0.9\">\n\n";

foreach my $file (@html_files) {
    open(my $fh, '<:encoding(UTF-8)', $file) or next;
    local $/;
    my $content = <$fh>;
    close($fh);

    my $rel = substr($file, length($repo_root));
    $rel =~ s/^\///;

    my $canonical;
    if ($content =~ /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i ||
        $content =~ /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i) {
        $canonical = $1;
    }

    my $loc;
    if ($canonical) {
        $loc = $canonical;
    } elsif ($rel eq "index.html") {
        $loc = "$base_url/";
    } else {
        $loc = "$base_url/$rel";
    }

    my ($priority, $changefreq) = ("0.8", "monthly");
    if ($rel eq "index.html") {
        ($priority, $changefreq) = ("1.0", "weekly");
    } elsif ($rel eq "makaleler.html") {
        ($priority, $changefreq) = ("0.9", "weekly");
    }

    my $lastmod = "2026-08-06";

    # Escape XML
    $loc =~ s/&/&amp;/g;
    $loc =~ s/</&lt;/g;
    $loc =~ s/>/&gt;/g;

    print $sm_out "  <url>\n";
    print $sm_out "    <loc>$loc</loc>\n";
    print $sm_out "    <lastmod>$lastmod</lastmod>\n";
    print $sm_out "    <changefreq>$changefreq</changefreq>\n";
    print $sm_out "    <priority>$priority</priority>\n";
    print $sm_out "  </url>\n\n";
}

print $sm_out "</urlset>\n";
close($sm_out);
print "Successfully updated sitemap.xml\n";

# -------------------------------------------------------------
# GENERATE SEARCH-INDEX.JSON
# -------------------------------------------------------------
my @entries = ();

foreach my $file (@html_files) {
    open(my $fh, '<:encoding(UTF-8)', $file) or next;
    local $/;
    my $content = <$fh>;
    close($fh);

    next unless $content =~ /<article class="article-container"/i;

    my $canonical;
    if ($content =~ /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i ||
        $content =~ /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i) {
        $canonical = $1;
    }

    my $title = "";
    if ($content =~ /<h1[^>]*>(.*?)<\/h1>/is) {
        $title = strip_tags($1);
    } elsif ($content =~ /<title[^>]*>(.*?)<\/title>/is) {
        $title = strip_tags($1);
    }

    my $excerpt = "";
    if ($content =~ /<meta[^>]+name=["']description["'][^>]+content=["'](.*?)["']/is) {
        $excerpt = strip_tags($1);
    }

    my $category = "";
    if ($content =~ /<span\s+class=["']chip["']>\s*⚖️\s*(.*?)<\/span>/is) {
        $category = strip_tags($1);
    }

    my $reading_time = "";
    if ($content =~ /<span\s+class=["']chip["']>\s*📖\s*(.*?)<\/span>/is) {
        $reading_time = strip_tags($1);
    }

    my $article_text = "";
    if ($content =~ /<article class="article-container"[^>]*>(.*?)<\/article>/is) {
        $article_text = strip_tags($1);
    }

    my $keyword_meta = "";
    if ($content =~ /<meta[^>]+name=["']keywords["'][^>]+content=["'](.*?)["']/is) {
        $keyword_meta = strip_tags($1);
    }

    my @section_headers = ();
    while ($content =~ /<h2[^>]*>(.*?)<\/h2>/gis) {
        push @section_headers, strip_tags($1);
    }

    my @keywords = ();
    push @keywords, split(/\s*,\s*/, $keyword_meta) if $keyword_meta;
    push @keywords, $category if $category;
    push @keywords, @section_headers[0..7] if @section_headers;

    my @clean_keywords = ();
    my %seen = ();
    foreach my $kw (@keywords) {
        next unless defined $kw && $kw ne "";
        my $lc = lc($kw);
        unless ($seen{$lc}) {
            $seen{$lc} = 1;
            push @clean_keywords, $kw;
        }
    }

    my $url_path = substr($file, length($repo_root));
    if ($canonical && $canonical =~ /\/\/[^\/]+\/(.+)$/) {
        $url_path = "/" . $1;
    }

    next unless $title;

    push @entries, {
        title => $title,
        excerpt => $excerpt,
        category => $category,
        keywords => \@clean_keywords,
        content => $article_text,
        reading_time => $reading_time,
        url => $url_path
    };
}

# Write JSON
open(my $json_out, '>:encoding(UTF-8)', "$repo_root/search-index.json") or die $!;
print $json_out json_encode_array(\@entries);
close($json_out);
print "Successfully updated search-index.json\n";

sub strip_tags {
    my ($html) = @_;
    return "" unless defined $html;
    $html =~ s/<script\b[^>]*>.*?<\/script>//gis;
    $html =~ s/<style\b[^>]*>.*?<\/style>//gis;
    $html =~ s/<[^>]+>/ /g;
    $html = decode_entities($html);
    $html =~ s/\s+/ /g;
    $html =~ s/^\s+|\s+$//g;
    return $html;
}

sub escape_json_str {
    my ($str) = @_;
    return '""' unless defined $str;
    $str =~ s/\\/\\\\/g;
    $str =~ s/"/\\"/g;
    $str =~ s/\n/\\n/g;
    $str =~ s/\r/\\r/g;
    $str =~ s/\t/\\t/g;
    return '"' . $str . '"';
}

sub json_encode_array {
    my ($arr_ref) = @_;
    my @json_objs = ();
    foreach my $obj (@$arr_ref) {
        my $t = escape_json_str($obj->{title});
        my $e = escape_json_str($obj->{excerpt});
        my $c = escape_json_str($obj->{category});
        my $r = escape_json_str($obj->{reading_time});
        my $u = escape_json_str($obj->{url});
        my $ct = escape_json_str($obj->{content});

        my @kw_strs = map { escape_json_str($_) } @{$obj->{keywords}};
        my $kw_json = "[\n      " . join(",\n      ", @kw_strs) . "\n    ]";

        push @json_objs, "  {\n" .
            "    \"title\": $t,\n" .
            "    \"excerpt\": $e,\n" .
            "    \"category\": $c,\n" .
            "    \"keywords\": $kw_json,\n" .
            "    \"content\": $ct,\n" .
            "    \"reading_time\": $r,\n" .
            "    \"url\": $u\n" .
            "  }";
    }
    return "[\n" . join(",\n", @json_objs) . "\n]\n";
}
