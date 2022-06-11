// Constants
var GOOD_MOVIE_RATING = 7;
var GOOD_TV_RATING = 8;
var GOOD_VIDEO_GAME_RATING = 8;
var COLOR_THRESHOLD = 160;

var getIdFromLink = function(href) {
  var matches = href.match(/title\/([a-z0-9]+)/i);
  return matches ? matches[1] : null;
};
// This function is called to stylize and color the rating for an individual work.
// Some of this code was harvested from the original extension, with modifications by Cory.
var getRatingTagColor = function(rating) {
  var red = 60;
  var green = 60;
  var blue = 60;
  var tag = $('<span/>');
  // Add extra spaces to not touch with any surrounding elements
  // If there's no rating, display the Not Rated text
  tag.html(' ' + (rating ? rating.toFixed(1) : '<span style="position: relative; padding-bottom: 9%; display: inline-block; text-align: center; top: 2px; font-size: 0.6em;"">Not Rated</span>') + ' ');
  tag.css('display', 'inline-block');
  tag.css('width', '6%');
  tag.css('text-align', 'center');
  // If there's no rating, make it rgb 60,60,60
  if (!rating) {
    tag.css('color', 'rgb(' + red + ','  + green + ','  + blue + ')');
    return tag;
  }
  else {
    // Adjust the red based on the rating
    red = (255 - (rating * 19.5)).toFixed(0);
    // If the rating would make G greater than 60 according
    // to this equation, calculate new G
    if (rating >= 2.3) {
      green = (rating * 20).toFixed(0);
    }
    // If the rating would make B greater than 60 according
    // to this equation, calculate new B
    if (rating >= 6.6) {
      blue = (rating * 9).toFixed(0);
    }
    // Set the color of tag to new RGB values and return
    tag.css('color', 'rgb(' + red + ','  + green + ', ' + blue + ')');
    // If the rating is higher than 8, add an SVG rectangle and color the
    // rectangle instead of the text.
    if (rating >= 8.0) {
      // Change the green string back into a number
      green = parseFloat(green);
      // Add 30 more. This makes the green rectangle stand out
      green = green + 30;
      // This is the rectangle code where we color the rectangle according to the math done above
      tag.html('<svg style="margin-left:5%" display="block" height="16" width="32.5"><rect x="0" y="0" height="15" width="32.5" rx="5" ry="5" stroke="black" stroke-width="0" fill="rgb( '+ red + ','  + green + ','  + blue + ')" /><text x="50%" y="50%" text-anchor="middle" dy=".32em" font-size=".85em">' + (rating ? rating.toFixed(1) : 'N/A') + '</text>Sorry, your browser does not support inline SVG.</svg>');
      tag.css('height', '13px');
      tag.css('font-weight', 'bold');
      tag.css('text-align', '');
    }
    return tag;
  }
};
// This function is called to stylize and color the rating for a person overall.
// It uses a different scale of coloring because it's much more difficult for a
// person to achieve a very high (8+) overall rating.
// Not used yet.
var getPersonRatingTagColor = function(rating) {
  var red = 60;
  var green = 60;
  var blue = 60;
  var tag = $('<span/>');
  // Add extra spaces to not touch with any surrounding elements
  tag.html(' ' + (rating ? rating : 'N/A') + ' ');
  tag.css('display', 'inline-block');
  tag.css('width', '14%');
  tag.css('font-size', '1.2em');
  tag.css('font-weight', 'bold');
  // If there's no rating, make it rgb 60,60,60
  if (!rating) {
    tag.css('color', 'rgb(' + red + ','  + green + ','  + blue + ')');
    return tag;
  }
  else {
    // Adjust the red based on the rating
    red = (255 - (rating * 19.5)).toFixed(0);
    // If the rating would make G greater than 60 according
    // to this equation, calculate new G
    if (rating >= 2.3) {
      green = (rating * 25.5).toFixed(0);
    }
    // If the rating would make B greater than 60 according
    // to this equation, calculate new B
    if (rating >= 6.6) {
      blue = (rating * 9).toFixed(0);
    }
    // Set the color of tag to new RGB values and return
    tag.css('color', 'rgb(' + red + ','  + green + ', ' + blue + ')');
    return tag;
  }
};
var getMovieType = function(row) {
  // Since the omdb api does not return any data regarding the type of the
  // movie (documentary, tv series, etc.), we have to search for all sort of
  // info within the movie row detect its type
  var matches = $(row).text().match(/\((.+?)\)/);
  return matches ? matches[1] : 'Film';
}
var isGoodMovie = function(row, rating) {
  var type = getMovieType(row);
  if (type == 'Video Game') {
    return rating >= GOOD_VIDEO_GAME_RATING;
  }
  return rating >= (type == 'Film' ? GOOD_MOVIE_RATING : GOOD_TV_RATING);
};
var addRatingToMovieRow = function(row, callback) {
  // Make sure you don't load the same ratings more times
  if ($(row).hasClass('with-rating')) {
    callback(null);
    return;
  }
  // Select the first anchor from row which has its href containing the word
  // "title," this way confirming that it's the one linking to the movie page
  // (in case the markup changes in the future). We want the anchor with the
  // link to the movie page because it contains the movie id
  $(row).find('a[href*=title]:first').each(function(i, anchor) {
    var id = getIdFromLink(this.href);
    // Bail out if no id could be extracted from the anchor's href
    if (!id) {
      // Also return an empty rating for expectedRatings to decrement
      callback(null);
      return;
    }
    // Request omdb api movie data for respective id
    $.get('https://www.omdbapi.com/?i=' + id + '&apikey=2ec174e2', function(response, xhr) {
      var data = response;
      // Bail out if response is invalid or imdbRating is missing
      if (!data || !data.imdbRating) {
        callback(null);
        return;
      }
      // By attaching .toFixed(1) we always parse to 1 decimal place. This caused the
      // Person Rating to always return NaN
      var rating = parseFloat(data.imdbRating, 10);
      // Insert rating tag after name anchor
      $(anchor).before(getRatingTagColor(rating));
      // Make not important stuff opaque
      // Ditched the opacity changing in favor of a colored number rating system
      // $(row).css('opacity', isGoodMovie(row, rating) ? 1 : 0.6);
      callback(rating);
    });
  });
  // Mark this section as having ratings loaded
  $(row).addClass('with-rating');
};
$.fn.loadSectionRatings = function(callback) {
  $(this).each(function(i, section) {
    var rows = $(this).find('.filmo-row');
    var ratingSum = 0;
    var ratingCount = 0;
    // Since gathering each rating requires an asynchronous request, we need
    // to know when all ratings have been gathered, so we start from the number
    // of film rows and wait until it has been consumed
    var expectedRatings = rows.length;
    rows.each(function() {
      // Send a callback for each movie in order to collect all rating from
      // this page and generate a mean for the featured actor
      addRatingToMovieRow(this, function(rating) {
        // Only add rating to list if it's a valid number, otherwise just
        // decrement the expected ratings count and ignore the value
        if (rating) {
          ratingSum += rating;
          ratingCount++;
        }
        // When a rating (be it N/A) for each movie has been returned, calculate
        // average rating and fire callback with it, if one is received
        if (!--expectedRatings) {
          var mean = (ratingSum / ratingCount).toFixed(1);
          if (typeof(callback) == 'function') {
            callback(mean);
          }
        }
      });
    });
  });
};
$.fn.loadPageRatings = function() {
  $(this).each(function(i, content) {
    var sections = $(this).find('#filmography').children(':odd');
    // Only target the visible filmography section for both having a more
    // relevant actor average and making fewer requests (at first). Show
    // average rating of person based on this (main) section
    sections.first(':visible').loadSectionRatings(function(rating) {
      // Add person rating next to its name
      $(content).find('h1.header').each(function() {
        var tag = getPersonRatingTagColor(rating);
        var span = $(this).find('span:first');
        if (span.length) {
          span.before(tag);
        } else {
          $(this).append(tag);
        }
      });
    });
    // Add click handlers for all remaining sections, in order for them to load
    // as soon as they are toggled visible
    sections.filter(':hidden').each(function(i) {
      $(this).prev().click(function() {
        $(this).next().loadSectionRatings();
      });
    });
  });
};
$(function() {
  // Load ratings for current page
  $('#pagecontent').loadPageRatings();
});
