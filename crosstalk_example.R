library(crosstalk);
library(DT);
library(htmltools)
library(dplyr);
library(tibble);


sd_full <- SharedData$new(mtcars, key = ~as.character(cyl))

sdf <- mtcars |>
  dplyr::group_by(cyl) |>
  (\(d) SharedData$new(d,
                       key = ~as.character(cyl),
                       group = sd_full$groupName()
  ))()

p <- sdf |> e_charts(hp) |> e_line(mpg,
    selectedMode = 'single',
    emphasis = list(focus='self', blurScope='series'),
    blur= list(itemStyle= list(opacity = 0.3)),
    datasetId = "Xtalk"
  )

styl <- 'width:50%;display:block;float:left;'
crosstalk::bscols(
  list(
    filter_slider("hp", "Horsepower", sdf, ~hp, width = "100%"),
    div(style=styl, filter_checkbox("cyl", "Cylinders", sdf, ~cyl, inline=TRUE)),
    div(style=styl, filter_checkbox("gear", "Gears", sdf, ~gear, inline=TRUE)),
    filter_select("carb", "Carburetors (select)", sdf, ~carb),
    datatable(sdf,
              class="compact", width="100%", height=350,
              extensions="Scroller", style="bootstrap",
              options=list(scroller=TRUE, deferRender=TRUE, scrollY=200)
    )
  ),
  list( p )
)
