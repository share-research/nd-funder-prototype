require('plyr')
dat <- read.csv('/Users/jspie/Code/Github/share-research/nd-funder-prototype/data/authorsByAwards.20190523000131.csv')
dat$awardTotal <- as.numeric(gsub('[$,]', '', dat$Award.Total.Amount))
dat$isInvestigator  <- dat$isInvestigator  == 'true'
dat$isLeadInvestigator <- dat$isLeadInvestigator == 'true'
dat$isFirstAuthor <- dat$isFirstAuthor == 'true'
dat$isLastAuthor <- dat$isLastAuthor == 'true'
dat$isHarper <- dat$isHarper == 'true'

pubs <- ddply(dat, c('fullName', 'grantId', 'isHarper'), summarize, 
              count=length(title), 
              total=unique(awardTotal), 
              investigator=sum(isInvestigator)+sum(isLeadInvestigator),
              importantAuthor=sum(isFirstAuthor)+sum(isLastAuthor)
        )

amounts <- ddply(pubs, c('fullName', 'isHarper'), summarize,
                 count=sum(count),
                 total=sum(total),
                 everWasInvestigator=sum(investigator),
                 everWasFirstOrLastAuthor=sum(importantAuthor))
amounts$everWasInvestigator <- amounts$everWasInvestigator > 0
amounts$everWasFirstOrLastAuthor <- amounts$everWasFirstOrLastAuthor > 0

summary(lm(total ~ everWasInvestigator + everWasFirstOrLastAuthor, data=amounts))

##############################################################################
# Another way to do this

processed <- ddply(dat, c('fullName', 'grantId'), function(x) {
  data.frame(
    fullName=unique(x$fullName),
    pubs=nrow(x),
    total=unique(x$awardTotal),
    isHarper=unique(x$isHarper),
    everWasInvestigator=(sum(x$isInvestigator)+sum(x$isLeadInvestigator))>0,
    everWasFirstOrLastAuthor=(sum(x$isFirstAuthor)+sum(x$isLastAuthor))>0,
    firstOrLastAuthorCounts=sum(x$isFirstAuthor)+sum(x$isLastAuthor)
  )
})

processed <- ddply(processed, c('fullName'), function(x) {
  data.frame(
    fullName=unique(x$fullName),
    pubs=sum(x$pubs),
    grants=nrow(x),
    total=sum(x$total),
    isHarper=unique(x$isHarper),
    everWasInvestigator=sum(x$everWasInvestigator) > 0,
    everWasFirstOrLastAuthor=sum(x$everWasFirstOrLastAuthor) > 0,
    firstOrLastAuthorCounts=sum(x$firstOrLastAuthorCounts)
  )
})

write.csv(
  processed[order(processed$total, decreasing = T),], 
  "/Users/jspie/Code/Github/share-research/nd-funder-prototype/data/processed-author-totals.csv"
)

summary(lm(total ~ pubs + grants + everWasInvestigator + everWasFirstOrLastAuthor + firstOrLastAuthorCounts, data=processed))
