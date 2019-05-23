# nd-funder-prototype

To create a per-publication CSV file

    node scripts/joinAuthorAwards.js

If it segfaults,

    node --max-old-space-size=24000 scripts/joinAuthorAwards.js

To generate graphs:

    node scripts/generateGraph.js && ./node_modules/.bin/static viz/

And then browse to http://127.0.0.1:8080/cyto/. Working on a D3 version, but that's not working yet.

#TODO

# 3 - Create visualization to plot on graph clustering based on co-author on paper
     ## - size of bubble by # grant dollars
    ## - size of bubble by # collaborators
    ## - color by gender
# 1 - report list of paper authors with grant dollars (greatest to least)
Add total dollar amount size of the bubble
# 6 - Run cluster analysis on terms from abstract (for authors with similar terms)
##- see if aligns with grants
# 7a - Wrap up some code as NodeJS modules
# 7 - center affiliation

Analysis

# 4 - a) author position and dollar amount - look at median or mixed effects modeling on author position
# 5 - b) do gender analysis against position, dollar amounts
# 2 - c) dollars represented as lead investigator versus author - do a line graph comparison? side by side tabular lists?  some combination with a) above?
